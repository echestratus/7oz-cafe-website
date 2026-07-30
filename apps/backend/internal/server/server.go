package server

import (
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/config"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/middleware"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/authentication"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/blog"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/cms"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/customer"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/health"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/loyalty"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/media"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/membership"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/modules/reservation"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/compress"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/recover"
	"go.uber.org/zap"
)

type Dependencies struct {
	Config             *config.Config
	Logger             *zap.Logger
	Postgres           *database.Postgres
	HealthService      *health.Service
	AuthService        *authentication.Service
	CMSService         *cms.Service
	BlogService        *blog.Service
	MediaService       *media.Service
	ReservationService *reservation.Service
	MembershipService  *membership.Service
	LoyaltyService     *loyalty.Service
	CustomerService    *customer.Service
}

func New(deps Dependencies) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      deps.Config.Name,
		ServerHeader: "7oz-api",
		ErrorHandler: middleware.ErrorHandler(deps.Logger),
		BodyLimit:    12 * 1024 * 1024,
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
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowCredentials: true,
	}))

	healthHandler := health.NewHandler(deps.HealthService)
	authHandler := authentication.NewHandler(deps.AuthService, deps.Config)
	cmsHandler := cms.NewHandler(deps.CMSService)
	blogHandler := blog.NewHandler(deps.BlogService)
	mediaHandler := media.NewHandler(deps.MediaService)
	reservationHandler := reservation.NewHandler(deps.ReservationService)
	membershipHandler := membership.NewHandler(deps.MembershipService)
	loyaltyHandler := loyalty.NewHandler(deps.LoyaltyService)
	customerHandler := customer.NewHandler(deps.CustomerService)
	authenticate := middleware.Authenticate(deps.AuthService)
	optionalAuth := middleware.OptionalAuthenticate(deps.AuthService)

	app.Get("/health", healthHandler.Live)
	app.Get("/live", healthHandler.Live)
	app.Get("/health/ready", healthHandler.Ready)
	app.Get("/ready", healthHandler.Ready)
	app.Get("/openapi.yaml", serveOpenAPI)
	media.RegisterPublicRoutes(app, mediaHandler)

	api := app.Group("/api/v1")
	health.RegisterRoutes(api, healthHandler)
	authentication.RegisterRoutes(api, authHandler, authenticate, deps.Config.CORSAllowedOrigins)
	cms.RegisterPublicRoutes(api, cmsHandler)
	cms.RegisterAdminRoutes(api, cmsHandler, authenticate)
	blog.RegisterPublicRoutes(api, blogHandler)
	blog.RegisterAdminRoutes(api, blogHandler, authenticate)
	media.RegisterAdminRoutes(api, mediaHandler, authenticate)
	reservation.RegisterPublicRoutes(api, reservationHandler, optionalAuth)
	reservation.RegisterCustomerRoutes(api, reservationHandler, authenticate)
	reservation.RegisterAdminRoutes(api, reservationHandler, authenticate)
	membership.RegisterPublicRoutes(api, membershipHandler)
	membership.RegisterCustomerRoutes(api, membershipHandler, authenticate)
	membership.RegisterAdminRoutes(api, membershipHandler, authenticate)
	loyalty.RegisterPublicRoutes(api, loyaltyHandler)
	loyalty.RegisterCustomerRoutes(api, loyaltyHandler, authenticate)
	loyalty.RegisterAdminRoutes(api, loyaltyHandler, authenticate)
	customer.RegisterAdminRoutes(api, customerHandler, authenticate)
	api.Get("/openapi.yaml", serveOpenAPI)

	deps.Logger.Info("routes registered", zap.String("service", deps.Config.Name))

	return app
}

func serveOpenAPI(c fiber.Ctx) error {
	c.Set(fiber.HeaderContentType, "application/yaml")
	return c.SendString(openAPISpec)
}
