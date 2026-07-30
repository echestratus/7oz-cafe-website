package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/cache"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/config"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/logger"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/authentication"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/blog"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/cms"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/health"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/loyalty"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/media"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/membership"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/reservation"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/server"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load config: %v\n", err)
		os.Exit(1)
	}

	log, err := logger.New(cfg.Env)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to create logger: %v\n", err)
		os.Exit(1)
	}
	defer func() {
		_ = log.Sync()
	}()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	startupCtx, cancel := context.WithTimeout(ctx, cfg.StartupTimeout())
	defer cancel()

	var postgres *database.Postgres
	postgres, err = database.NewPostgres(startupCtx, cfg.Database, cfg.DatabaseDSN())
	if err != nil {
		if cfg.IsDevelopment() {
			log.Warn("postgres unavailable; continuing in degraded mode", zap.Error(err))
		} else {
			log.Fatal("failed to connect to postgres", zap.Error(err))
		}
	} else {
		defer postgres.Close()
	}

	var redisClient *cache.Redis
	redisClient, err = cache.NewRedis(startupCtx, cfg.Redis)
	if err != nil {
		if cfg.IsDevelopment() {
			log.Warn("redis unavailable; continuing in degraded mode", zap.Error(err))
		} else {
			log.Fatal("failed to connect to redis", zap.Error(err))
		}
	} else {
		defer func() {
			if closeErr := redisClient.Close(); closeErr != nil {
				log.Warn("failed to close redis", zap.Error(closeErr))
			}
		}()
	}

	healthService := health.NewService(cfg.Name, postgres, redisClient)
	authService := authentication.NewService(cfg, postgres)
	cmsService := cms.NewService(postgres)
	blogService := blog.NewService(postgres)
	mediaService := media.NewService(cfg, postgres)
	reservationService := reservation.NewService(postgres)
	membershipService := membership.NewService(postgres)
	loyaltyService := loyalty.NewService(postgres)
	membershipService.SetLifetimePointsProvider(loyaltyService.GetLifetimeEarnedPoints)
	reservationService.SetOnCompleted(func(ctx context.Context, userID uuid.UUID, reservationID uuid.UUID) {
		_, _ = loyaltyService.EarnForReservationCompleted(ctx, userID, reservationID)
		_, _ = membershipService.EvaluateForUser(ctx, userID, "reservation_completed", nil, "Completed reservation qualification check")
	})
	app := server.New(server.Dependencies{
		Config:             cfg,
		Logger:             log,
		Postgres:           postgres,
		HealthService:      healthService,
		AuthService:        authService,
		CMSService:         cmsService,
		BlogService:        blogService,
		MediaService:       mediaService,
		ReservationService: reservationService,
		MembershipService:  membershipService,
		LoyaltyService:     loyaltyService,
	})

	addr := fmt.Sprintf(":%d", cfg.Port)
	log.Info("starting api server", zap.String("addr", addr), zap.String("env", cfg.Env))

	errCh := make(chan error, 1)
	go func() {
		errCh <- app.Listen(addr)
	}()

	select {
	case <-ctx.Done():
		log.Info("shutdown signal received")
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer shutdownCancel()

		if err := app.ShutdownWithContext(shutdownCtx); err != nil {
			log.Error("graceful shutdown failed", zap.Error(err))
		}
	case err := <-errCh:
		if err != nil {
			log.Fatal("server stopped unexpectedly", zap.Error(err))
		}
	}
}
