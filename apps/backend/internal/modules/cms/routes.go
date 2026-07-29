package cms

import (
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/middleware"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
)

func RegisterPublicRoutes(router fiber.Router, handler *Handler) {
	public := router.Group("/public/cms")

	public.Get("/homepage", publicPage(handler, "homepage"))
	public.Get("/about", publicPage(handler, "about"))
	public.Get("/footer", publicPage(handler, "footer"))
	public.Get("/contact", publicPage(handler, "contact"))
	public.Get("/pages/:slug", handler.GetPublicPage)
}

func RegisterAdminRoutes(router fiber.Router, handler *Handler, authenticate fiber.Handler) {
	admin := router.Group("/admin/cms", authenticate, middleware.RequirePermission("cms.manage"))

	admin.Get("/", handler.ListPages)
	admin.Get("/pages", handler.ListPages)
	admin.Get("/pages/:slug", handler.GetDraftPage)
	admin.Patch("/pages/:slug/seo", handler.UpdatePageSEO)
	admin.Get("/pages/:slug/versions", handler.ListVersions)
	admin.Post("/pages/:slug/publish", handler.Publish)
	admin.Post("/pages/:slug/rollback", handler.Rollback)
	admin.Patch("/sections/:sectionID", handler.UpdateSection)

	admin.Post("/publish", handler.PublishByBody)
	admin.Post("/rollback", handler.RollbackByBody)
}

func publicPage(handler *Handler, slug string) fiber.Handler {
	return func(c fiber.Ctx) error {
		page, err := handler.service.GetPublishedPage(c.Context(), slug)
		if err != nil {
			return err
		}
		return response.JSON(c, fiber.StatusOK, response.OK("OK", page))
	}
}
