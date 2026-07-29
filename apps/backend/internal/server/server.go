package server

import (
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/config"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/middleware"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/health"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/compress"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/recover"
	"go.uber.org/zap"
)

type Dependencies struct {
	Config        *config.Config
	Logger        *zap.Logger
	HealthService *health.Service
}

func New(deps Dependencies) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      deps.Config.Name,
		ServerHeader: "7oz-api",
		ErrorHandler: middleware.ErrorHandler(deps.Logger),
	})

	app.Use(recover.New())
	app.Use(middleware.RequestID())
	app.Use(middleware.RequestLogger(deps.Logger))
	app.Use(compress.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: deps.Config.CORSAllowedOrigins,
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Accept",
			"Authorization",
			"X-Request-ID",
		},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
	}))

	healthHandler := health.NewHandler(deps.HealthService)

	app.Get("/health", healthHandler.Live)
	app.Get("/health/ready", healthHandler.Ready)
	app.Get("/openapi.yaml", serveOpenAPI)

	api := app.Group("/api/v1")
	health.RegisterRoutes(api, healthHandler)
	api.Get("/openapi.yaml", serveOpenAPI)

	deps.Logger.Info("routes registered", zap.String("service", deps.Config.Name))

	return app
}

func serveOpenAPI(c fiber.Ctx) error {
	c.Set(fiber.HeaderContentType, "application/yaml")
	return c.SendString(openAPISpec)
}
