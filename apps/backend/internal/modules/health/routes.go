package health

import "github.com/gofiber/fiber/v3"

func RegisterRoutes(router fiber.Router, handler *Handler) {
	router.Get("/health", handler.Check)
}
