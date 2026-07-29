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
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/health"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/server"
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
	app := server.New(server.Dependencies{
		Config:        cfg,
		Logger:        log,
		HealthService: healthService,
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
