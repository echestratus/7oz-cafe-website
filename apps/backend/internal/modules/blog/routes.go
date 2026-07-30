package blog

import (
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/middleware"
	"github.com/gofiber/fiber/v3"
)

func RegisterPublicRoutes(router fiber.Router, handler *Handler) {
	public := router.Group("/public/blogs")
	public.Get("/", handler.ListPublic)
	public.Get("/:slug", handler.GetPublicBySlug)
}

func RegisterAdminRoutes(router fiber.Router, handler *Handler, authenticate fiber.Handler) {
	admin := router.Group("/admin/blogs", authenticate, middleware.RequirePermission("blog.manage"))
	admin.Get("/", handler.ListAdmin)
	admin.Post("/", handler.Create)
	admin.Get("/:id", handler.GetAdmin)
	admin.Patch("/:id", handler.Update)
	admin.Delete("/:id", handler.Delete)
}
