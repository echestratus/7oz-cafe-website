package users

import (
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/middleware"
	"github.com/gofiber/fiber/v3"
)

func RegisterAdminRoutes(router fiber.Router, handler *Handler, authenticate fiber.Handler) {
	users := router.Group("/admin/users", authenticate, middleware.RequirePermission("user.manage"))
	users.Get("/", handler.List)
	users.Post("/", handler.Create)
	users.Get("/:id", handler.Get)
	users.Patch("/:id/status", handler.UpdateStatus)
	users.Put("/:id/role", middleware.RequirePermission("role.manage"), handler.UpdateRole)

	roles := router.Group("/admin/roles", authenticate, middleware.RequirePermission("user.manage"))
	roles.Get("/", handler.ListRoles)
}
