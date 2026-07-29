package authentication

import (
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/middleware"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/limiter"
)

func RegisterRoutes(router fiber.Router, handler *Handler, authenticate fiber.Handler, allowedOrigins []string) {
	auth := router.Group("/auth")

	authLimiter := limiter.New(limiter.Config{
		Max:        20,
		Expiration: time.Minute,
		LimitReached: func(c fiber.Ctx) error {
			return apperr.TooManyRequests("Too many authentication attempts. Please try again later.")
		},
	})

	auth.Post("/register", authLimiter, handler.Register)
	auth.Post("/verify-email", authLimiter, handler.VerifyEmail)
	auth.Post("/login", authLimiter, handler.Login)
	auth.Post("/forgot-password", authLimiter, handler.ForgotPassword)
	auth.Post("/reset-password", authLimiter, handler.ResetPassword)

	auth.Post("/refresh", middleware.RequireTrustedOrigin(allowedOrigins), handler.Refresh)
	auth.Post("/logout", middleware.RequireTrustedOrigin(allowedOrigins), handler.Logout)
	auth.Get("/me", authenticate, handler.Me)
}
