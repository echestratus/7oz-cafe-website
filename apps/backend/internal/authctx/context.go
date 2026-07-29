package authctx

import (
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

const (
	localsUserID      = "auth_user_id"
	localsEmail       = "auth_email"
	localsSessionID   = "auth_session_id"
	localsRoles       = "auth_roles"
	localsPermissions = "auth_permissions"
)

type Principal struct {
	UserID      uuid.UUID
	Email       string
	SessionID   uuid.UUID
	Roles       []string
	Permissions []string
}

func SetPrincipal(c fiber.Ctx, principal Principal) {
	c.Locals(localsUserID, principal.UserID)
	c.Locals(localsEmail, principal.Email)
	c.Locals(localsSessionID, principal.SessionID)
	c.Locals(localsRoles, principal.Roles)
	c.Locals(localsPermissions, principal.Permissions)
}

func PrincipalFromCtx(c fiber.Ctx) (Principal, bool) {
	userID, ok := c.Locals(localsUserID).(uuid.UUID)
	if !ok {
		return Principal{}, false
	}

	sessionID, ok := c.Locals(localsSessionID).(uuid.UUID)
	if !ok {
		return Principal{}, false
	}

	email, _ := c.Locals(localsEmail).(string)
	roles, _ := c.Locals(localsRoles).([]string)
	permissions, _ := c.Locals(localsPermissions).([]string)

	return Principal{
		UserID:      userID,
		Email:       email,
		SessionID:   sessionID,
		Roles:       roles,
		Permissions: permissions,
	}, true
}
