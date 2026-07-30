package loyalty

import (
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/middleware"
	"github.com/gofiber/fiber/v3"
)

func RegisterPublicRoutes(router fiber.Router, handler *Handler) {
	public := router.Group("/public/loyalty")
	public.Get("/rewards", handler.ListPublicRewards)
}

func RegisterCustomerRoutes(router fiber.Router, handler *Handler, authenticate fiber.Handler) {
	customer := router.Group("/customer/loyalty", authenticate, middleware.RequirePermission("loyalty.read_own"))
	customer.Get("/", handler.GetCustomerAccount)
	customer.Get("/history", handler.GetCustomerHistory)
	customer.Get("/rewards", handler.GetCustomerRewards)
	customer.Post("/redeem", handler.Redeem)
}

func RegisterAdminRoutes(router fiber.Router, handler *Handler, authenticate fiber.Handler) {
	admin := router.Group("/admin/loyalty", authenticate, middleware.RequirePermission("loyalty.manage"))
	admin.Get("/", handler.ListAdminAccounts)
	admin.Get("/history", handler.ListAdminHistory)
	admin.Post("/adjustments", handler.Adjust)
	admin.Get("/campaigns", handler.ListCampaigns)
	admin.Post("/campaigns", handler.CreateCampaign)
	admin.Patch("/campaigns/:id", handler.UpdateCampaign)
	admin.Get("/rewards", handler.ListRewards)
	admin.Post("/rewards", handler.CreateReward)
	admin.Patch("/rewards/:id", handler.UpdateReward)
	admin.Delete("/rewards/:id", handler.DeleteReward)
}
