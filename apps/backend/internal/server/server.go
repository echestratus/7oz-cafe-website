package server

import (
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/config"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/middleware"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/health"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/recover"
	"go.uber.org/zap"
)

func New(cfg *config.Config, logger *zap.Logger) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      cfg.Name,
		ServerHeader: "7oz-api",
	})

	app.Use(recover.New())
	app.Use(middleware.RequestID())
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.CORSAllowedOrigins,
		AllowHeaders: []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Request-ID"},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
	}))

	healthHandler := health.NewHandler(cfg.Name)

	app.Get("/health", healthHandler.Check)

	api := app.Group("/api/v1")
	health.RegisterRoutes(api, healthHandler)

	logger.Info("routes registered", zap.String("service", cfg.Name))

	return app
}
