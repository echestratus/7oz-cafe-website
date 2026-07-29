package reservation

import (
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/middleware"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/limiter"
)

func RegisterPublicRoutes(router fiber.Router, handler *Handler, optionalAuth fiber.Handler) {
	public := router.Group("/public/reservations")

	createLimiter := limiter.New(limiter.Config{
		Max:        10,
		Expiration: time.Minute,
		LimitReached: func(c fiber.Ctx) error {
			return apperr.TooManyRequests("Too many reservation attempts. Please try again later.")
		},
	})

	public.Get("/availability", handler.GetAvailability)
	public.Post("/", optionalAuth, createLimiter, handler.CreatePublic)
}

func RegisterCustomerRoutes(router fiber.Router, handler *Handler, authenticate fiber.Handler) {
	customer := router.Group("/customer/reservations", authenticate)

	customer.Get("/", handler.ListCustomer)
	customer.Post("/", handler.CreateCustomer)
	customer.Get("/:id", handler.GetCustomer)
	customer.Delete("/:id", handler.CancelCustomer)
}

func RegisterAdminRoutes(router fiber.Router, handler *Handler, authenticate fiber.Handler) {
	admin := router.Group("/admin/reservations", authenticate, middleware.RequirePermission("reservation.manage"))

	admin.Get("/", handler.ListAdmin)
	admin.Get("/:id", handler.GetAdmin)
	admin.Patch("/:id", handler.AssignTable)
	admin.Patch("/:id/confirm", handler.Confirm)
	admin.Patch("/:id/check-in", handler.CheckIn)
	admin.Patch("/:id/complete", handler.Complete)
	admin.Patch("/:id/cancel", handler.CancelAdmin)
	admin.Patch("/:id/no-show", handler.NoShow)
}
