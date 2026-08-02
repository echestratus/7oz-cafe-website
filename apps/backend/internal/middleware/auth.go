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
		if err := attachPrincipal(c, parser, true); err != nil {
			return err
		}
		return c.Next()
	}
}

// OptionalAuthenticate attaches a principal when a valid Bearer token is present.
// Missing or invalid tokens are ignored so guest flows can continue.
func OptionalAuthenticate(parser AccessTokenParser) fiber.Handler {
	return func(c fiber.Ctx) error {
		_ = attachPrincipal(c, parser, false)
		return c.Next()
	}
}

func attachPrincipal(c fiber.Ctx, parser AccessTokenParser, required bool) error {
	header := c.Get("Authorization")
	if header == "" || !strings.HasPrefix(header, "Bearer ") {
		if required {
			return apperr.Unauthorized("Authentication required.")
		}
		return nil
	}

	raw := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
	claims, err := parser.ParseAccessToken(raw)
	if err != nil {
		if required {
			return apperr.Unauthorized("Invalid or expired access token.")
		}
		return nil
	}

	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		if required {
			return apperr.Unauthorized("Invalid access token subject.")
		}
		return nil
	}

	sessionID, err := uuid.Parse(claims.SessionID)
	if err != nil {
		if required {
			return apperr.Unauthorized("Invalid access token session.")
		}
		return nil
	}

	authctx.SetPrincipal(c, authctx.Principal{
		UserID:      userID,
		Email:       claims.Email,
		SessionID:   sessionID,
		Roles:       claims.Roles,
		Permissions: claims.Permissions,
	})

	return nil
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
