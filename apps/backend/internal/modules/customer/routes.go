package customer

import (
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/middleware"
	"github.com/gofiber/fiber/v3"
)

func RegisterAdminRoutes(router fiber.Router, handler *Handler, authenticate fiber.Handler) {
	admin := router.Group("/admin/customers", authenticate, middleware.RequirePermission("customer.read"))
	admin.Get("/", handler.List)
	admin.Get("/:id", handler.Get)
	admin.Patch("/:id/status", middleware.RequirePermission("user.manage"), handler.UpdateStatus)
}
