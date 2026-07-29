package main

import (
	"fmt"
	"os"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/config"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/server"
	"go.uber.org/zap"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load config: %v\n", err)
		os.Exit(1)
	}

	logger, err := zap.NewProduction()
	if cfg.Env == "development" {
		logger, err = zap.NewDevelopment()
	}
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to create logger: %v\n", err)
		os.Exit(1)
	}
	defer func() {
		_ = logger.Sync()
	}()

	app := server.New(cfg, logger)

	addr := fmt.Sprintf(":%d", cfg.Port)
	logger.Info("starting api server", zap.String("addr", addr), zap.String("env", cfg.Env))

	if err := app.Listen(addr); err != nil {
		logger.Fatal("server stopped unexpectedly", zap.Error(err))
	}
}
