package media

import (
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/middleware"
	"github.com/gofiber/fiber/v3"
)

func RegisterAdminRoutes(router fiber.Router, handler *Handler, authenticate fiber.Handler) {
	admin := router.Group("/admin/media", authenticate, middleware.RequirePermission("cms.manage"))
	admin.Get("/", handler.List)
	admin.Post("/", handler.Upload)
	admin.Delete("/:id", handler.Delete)
}

func RegisterPublicRoutes(app *fiber.App, handler *Handler) {
	app.Get("/media/:storageKey", handler.Serve)
}
