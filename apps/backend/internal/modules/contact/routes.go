package contact

import (
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/limiter"
)

func RegisterPublicRoutes(router fiber.Router, handler *Handler) {
	public := router.Group("/public/contact")

	submitLimiter := limiter.New(limiter.Config{
		Max:        10,
		Expiration: time.Minute,
		LimitReached: func(c fiber.Ctx) error {
			return apperr.TooManyRequests("Too many contact attempts. Please try again later.")
		},
	})

	public.Post("/", submitLimiter, handler.Create)
}
