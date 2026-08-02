package gallery

import (
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/middleware"
	"github.com/gofiber/fiber/v3"
)

func RegisterPublicRoutes(router fiber.Router, handler *Handler) {
	public := router.Group("/public/gallery")
	public.Get("/", handler.ListPublic)
}

func RegisterAdminRoutes(router fiber.Router, handler *Handler, authenticate fiber.Handler) {
	admin := router.Group("/admin/gallery", authenticate, middleware.RequirePermission("gallery.manage"))
	admin.Get("/", handler.ListAdmin)
	admin.Post("/", handler.Create)
	admin.Get("/:id", handler.GetAdmin)
	admin.Patch("/:id", handler.Update)
	admin.Delete("/:id", handler.Delete)
}
