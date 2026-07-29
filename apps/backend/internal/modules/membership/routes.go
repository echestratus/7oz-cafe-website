package membership

import (
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/middleware"
	"github.com/gofiber/fiber/v3"
)

func RegisterPublicRoutes(router fiber.Router, handler *Handler) {
	public := router.Group("/public/membership")
	public.Get("/levels", handler.ListPublicLevels)
	public.Get("/benefits", handler.ListPublicBenefits)
}

func RegisterCustomerRoutes(router fiber.Router, handler *Handler, authenticate fiber.Handler) {
	customer := router.Group("/customer/membership", authenticate, middleware.RequirePermission("membership.read_own"))
	customer.Get("/", handler.GetCustomerMembership)
	customer.Get("/benefits", handler.GetCustomerBenefits)
	customer.Get("/history", handler.GetCustomerHistory)
}

func RegisterAdminRoutes(router fiber.Router, handler *Handler, authenticate fiber.Handler) {
	admin := router.Group("/admin", authenticate, middleware.RequirePermission("membership.manage"))

	admin.Get("/memberships", handler.ListAdmin)
	admin.Get("/memberships/:id", handler.GetAdmin)
	admin.Get("/memberships/:id/history", handler.GetAdminHistory)
	admin.Patch("/memberships/:id", handler.UpdateMembership)
	admin.Patch("/memberships/:id/status", handler.UpdateStatus)

	admin.Get("/membership-levels", handler.ListLevels)
	admin.Patch("/membership-levels/:id", handler.UpdateLevel)
}
