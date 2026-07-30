package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/config"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/logger"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/loyalty"
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

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	postgres, err := database.NewPostgres(ctx, cfg.Database, cfg.DatabaseDSN())
	if err != nil {
		log.Fatal("failed to connect to postgres", zap.Error(err))
	}
	defer postgres.Close()

	service := loyalty.NewService(postgres)
	result, err := service.ExpirePoints(ctx, time.Now().UTC())
	if err != nil {
		log.Fatal("loyalty expiration failed", zap.Error(err))
	}

	log.Info("loyalty expiration completed",
		zap.String("strategy", result.Strategy),
		zap.Bool("skipped", result.Skipped),
		zap.Int("accountsScanned", result.AccountsScanned),
		zap.Int("accountsExpired", result.AccountsExpired),
		zap.Int32("pointsExpired", result.PointsExpired),
	)
}
