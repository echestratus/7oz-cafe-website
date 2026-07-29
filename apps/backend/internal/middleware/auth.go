package middleware

import (
	"strings"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/authctx"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/security/token"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type AccessTokenParser interface {
	ParseAccessToken(accessToken string) (*token.AccessClaims, error)
}

func Authenticate(parser AccessTokenParser) fiber.Handler {
	return func(c fiber.Ctx) error {
		header := c.Get("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			return apperr.Unauthorized("Authentication required.")
		}

		raw := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
		claims, err := parser.ParseAccessToken(raw)
		if err != nil {
			return apperr.Unauthorized("Invalid or expired access token.")
		}

		userID, err := uuid.Parse(claims.Subject)
		if err != nil {
			return apperr.Unauthorized("Invalid access token subject.")
		}

		sessionID, err := uuid.Parse(claims.SessionID)
		if err != nil {
			return apperr.Unauthorized("Invalid access token session.")
		}

		authctx.SetPrincipal(c, authctx.Principal{
			UserID:      userID,
			Email:       claims.Email,
			SessionID:   sessionID,
			Roles:       claims.Roles,
			Permissions: claims.Permissions,
		})

		return c.Next()
	}
}

func RequirePermission(permission string) fiber.Handler {
	return func(c fiber.Ctx) error {
		principal, ok := authctx.PrincipalFromCtx(c)
		if !ok {
			return apperr.Unauthorized("Authentication required.")
		}

		for _, code := range principal.Permissions {
			if code == permission {
				return c.Next()
			}
		}

		return apperr.Forbidden("You do not have permission to perform this action.")
	}
}

func RequireRole(role string) fiber.Handler {
	return func(c fiber.Ctx) error {
		principal, ok := authctx.PrincipalFromCtx(c)
		if !ok {
			return apperr.Unauthorized("Authentication required.")
		}

		for _, code := range principal.Roles {
			if code == role {
				return c.Next()
			}
		}

		return apperr.Forbidden("You do not have the required role.")
	}
}

func RequireTrustedOrigin(allowedOrigins []string) fiber.Handler {
	allowed := map[string]struct{}{}
	for _, origin := range allowedOrigins {
		allowed[strings.TrimSpace(origin)] = struct{}{}
	}

	return func(c fiber.Ctx) error {
		origin := strings.TrimSpace(c.Get("Origin"))
		if origin == "" {
			// Non-browser clients may omit Origin; allow only when no Origin is present.
			return c.Next()
		}

		if _, ok := allowed[origin]; !ok {
			return apperr.Forbidden("Origin is not allowed.")
		}

		return c.Next()
	}
}
