package authentication

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/config"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database/sqlcdb"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/security/password"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/security/token"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

const (
	refreshCookieName = "refresh_token"
	customerRoleCode  = "customer"
)

type Service struct {
	cfg    *config.Config
	db     *database.Postgres
	access *token.AccessManager
}

type RegisterInput struct {
	FullName string
	Email    string
	Password string
}

type LoginInput struct {
	Email     string
	Password  string
	UserAgent string
	IPAddress string
}

type AuthResult struct {
	AccessToken          string     `json:"accessToken,omitempty"`
	AccessTokenExpiresAt *time.Time `json:"accessTokenExpiresAt,omitempty"`
	User                 UserDTO    `json:"user"`
	RefreshToken         string     `json:"-"`
	VerificationToken    string     `json:"verificationToken,omitempty"`
	PasswordResetToken   string     `json:"passwordResetToken,omitempty"`
}

type UserDTO struct {
	ID          string   `json:"id"`
	Email       string   `json:"email"`
	FullName    string   `json:"fullName"`
	Status      string   `json:"status"`
	Roles       []string `json:"roles"`
	Permissions []string `json:"permissions"`
}

type RequestMeta struct {
	UserAgent string
	IPAddress string
}

func NewService(cfg *config.Config, db *database.Postgres) *Service {
	return &Service{
		cfg:    cfg,
		db:     db,
		access: token.NewAccessManager(cfg.JWT.AccessSecret, cfg.JWT.AccessTTL, cfg.Name),
	}
}

func (s *Service) Register(ctx context.Context, input RegisterInput) (*AuthResult, error) {
	if s.db == nil {
		return nil, apperr.Internal("Database is unavailable.")
	}

	fullName := strings.TrimSpace(input.FullName)
	email := strings.TrimSpace(strings.ToLower(input.Email))
	var fieldErrors []response.FieldError
	if fullName == "" {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "fullName", Message: "is required"})
	}
	if email == "" {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "email", Message: "is required"})
	}
	if len(fieldErrors) > 0 {
		return nil, apperr.Validation("Invalid registration payload.", fieldErrors...)
	}

	if err := password.Validate(input.Password); err != nil {
		return nil, err
	}

	if _, err := s.db.Queries.GetUserByEmail(ctx, email); err == nil {
		return nil, apperr.Conflict("An account with this email already exists.")
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return nil, apperr.Wrap(apperr.Internal("Failed to register user."), err)
	}

	role, err := s.db.Queries.GetRoleByCode(ctx, customerRoleCode)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to assign customer role."), err)
	}

	hash, err := password.Hash(input.Password)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to secure password."), err)
	}

	userID := uuid.New()
	user, err := s.db.Queries.CreateUser(ctx, sqlcdb.CreateUserParams{
		ID:              userID,
		Email:           email,
		PasswordHash:    hash,
		FullName:        fullName,
		Status:          "pending_verification",
		EmailVerifiedAt: nil,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to create user."), err)
	}

	if err := s.db.Queries.AssignUserRole(ctx, sqlcdb.AssignUserRoleParams{
		UserID: user.ID,
		RoleID: role.ID,
	}); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to assign role."), err)
	}

	verificationRaw, verificationHash, err := token.NewRefreshToken()
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to create verification token."), err)
	}

	if _, err := s.db.Queries.CreateAuthToken(ctx, sqlcdb.CreateAuthTokenParams{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenHash: verificationHash,
		Purpose:   "email_verification",
		ExpiresAt: time.Now().UTC().Add(24 * time.Hour),
	}); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to store verification token."), err)
	}

	_ = s.writeAudit(ctx, &user.ID, "auth.register", "user", user.ID.String(), RequestMeta{}, map[string]any{
		"email": user.Email,
	})

	result := &AuthResult{
		User: UserDTO{
			ID:          user.ID.String(),
			Email:       user.Email,
			FullName:    user.FullName,
			Status:      user.Status,
			Roles:       []string{customerRoleCode},
			Permissions: []string{},
		},
	}

	if s.cfg.IsDevelopment() {
		result.VerificationToken = verificationRaw
	}

	return result, nil
}

func (s *Service) VerifyEmail(ctx context.Context, rawToken string) (*UserDTO, error) {
	if s.db == nil {
		return nil, apperr.Internal("Database is unavailable.")
	}

	rawToken = strings.TrimSpace(rawToken)
	if rawToken == "" {
		return nil, apperr.Validation("Verification token is required.", response.FieldError{
			Field:   "token",
			Message: "is required",
		})
	}

	authToken, err := s.db.Queries.GetAuthTokenByHash(ctx, token.HashOpaqueToken(rawToken))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.BadRequest("Invalid or expired verification token.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to verify email."), err)
	}

	if authToken.Purpose != "email_verification" || authToken.UsedAt != nil || authToken.ExpiresAt.Before(time.Now().UTC()) {
		return nil, apperr.BadRequest("Invalid or expired verification token.")
	}

	user, err := s.db.Queries.MarkUserEmailVerified(ctx, authToken.UserID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to activate account."), err)
	}

	if err := s.db.Queries.MarkAuthTokenUsed(ctx, authToken.ID); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to consume verification token."), err)
	}

	roles, permissions, err := s.loadRBAC(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	_ = s.writeAudit(ctx, &user.ID, "auth.email_verified", "user", user.ID.String(), RequestMeta{}, nil)

	return &UserDTO{
		ID:          user.ID.String(),
		Email:       user.Email,
		FullName:    user.FullName,
		Status:      user.Status,
		Roles:       roles,
		Permissions: permissions,
	}, nil
}

func (s *Service) Login(ctx context.Context, input LoginInput) (*AuthResult, error) {
	if s.db == nil {
		return nil, apperr.Internal("Database is unavailable.")
	}

	email := strings.TrimSpace(strings.ToLower(input.Email))
	user, err := s.db.Queries.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			_ = s.writeAudit(ctx, nil, "auth.login_failed", "user", email, RequestMeta{
				UserAgent: input.UserAgent,
				IPAddress: input.IPAddress,
			}, map[string]any{"reason": "unknown_email"})
			return nil, apperr.Unauthorized("Invalid email or password.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to login."), err)
	}

	match, err := password.Compare(input.Password, user.PasswordHash)
	if err != nil || !match {
		_ = s.writeAudit(ctx, &user.ID, "auth.login_failed", "user", user.ID.String(), RequestMeta{
			UserAgent: input.UserAgent,
			IPAddress: input.IPAddress,
		}, map[string]any{"reason": "invalid_password"})
		return nil, apperr.Unauthorized("Invalid email or password.")
	}

	if user.Status != "active" {
		return nil, apperr.Forbidden("Account is not active. Please verify your email.")
	}

	result, err := s.issueSession(ctx, user, RequestMeta{
		UserAgent: input.UserAgent,
		IPAddress: input.IPAddress,
	})
	if err != nil {
		return nil, err
	}

	if err := s.db.Queries.UpdateUserLastLogin(ctx, user.ID); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to update last login."), err)
	}

	_ = s.writeAudit(ctx, &user.ID, "auth.login", "session", result.User.ID, RequestMeta{
		UserAgent: input.UserAgent,
		IPAddress: input.IPAddress,
	}, nil)

	return result, nil
}

func (s *Service) Refresh(ctx context.Context, rawRefresh string, meta RequestMeta) (*AuthResult, error) {
	if s.db == nil {
		return nil, apperr.Internal("Database is unavailable.")
	}

	if strings.TrimSpace(rawRefresh) == "" {
		return nil, apperr.Unauthorized("Refresh token is required.")
	}

	session, err := s.db.Queries.GetSessionByRefreshTokenHash(ctx, token.HashOpaqueToken(rawRefresh))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.Unauthorized("Invalid refresh token.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to refresh session."), err)
	}

	if session.RevokedAt != nil || session.ExpiresAt.Before(time.Now().UTC()) {
		return nil, apperr.Unauthorized("Refresh token is expired or revoked.")
	}

	if err := s.db.Queries.RevokeSession(ctx, session.ID); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to rotate refresh token."), err)
	}

	user, err := s.db.Queries.GetUserByID(ctx, session.UserID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load user for refresh."), err)
	}

	if user.Status != "active" {
		return nil, apperr.Forbidden("Account is not active.")
	}

	result, err := s.issueSession(ctx, user, meta)
	if err != nil {
		return nil, err
	}

	_ = s.writeAudit(ctx, &user.ID, "auth.refresh", "session", session.ID.String(), meta, nil)
	return result, nil
}

func (s *Service) Logout(ctx context.Context, rawRefresh string, meta RequestMeta) error {
	if s.db == nil {
		return apperr.Internal("Database is unavailable.")
	}

	if strings.TrimSpace(rawRefresh) == "" {
		return nil
	}

	session, err := s.db.Queries.GetSessionByRefreshTokenHash(ctx, token.HashOpaqueToken(rawRefresh))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return apperr.Wrap(apperr.Internal("Failed to logout."), err)
	}

	if err := s.db.Queries.RevokeSession(ctx, session.ID); err != nil {
		return apperr.Wrap(apperr.Internal("Failed to revoke session."), err)
	}

	_ = s.writeAudit(ctx, &session.UserID, "auth.logout", "session", session.ID.String(), meta, nil)
	return nil
}

func (s *Service) Me(ctx context.Context, userID uuid.UUID) (*UserDTO, error) {
	if s.db == nil {
		return nil, apperr.Internal("Database is unavailable.")
	}

	user, err := s.db.Queries.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.Unauthorized("Authentication required.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load profile."), err)
	}

	roles, permissions, err := s.loadRBAC(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	return &UserDTO{
		ID:          user.ID.String(),
		Email:       user.Email,
		FullName:    user.FullName,
		Status:      user.Status,
		Roles:       roles,
		Permissions: permissions,
	}, nil
}

func (s *Service) ForgotPassword(ctx context.Context, email string) (string, error) {
	if s.db == nil {
		return "", apperr.Internal("Database is unavailable.")
	}

	email = strings.TrimSpace(strings.ToLower(email))
	user, err := s.db.Queries.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", nil
		}
		return "", apperr.Wrap(apperr.Internal("Failed to process password reset."), err)
	}

	raw, hash, err := token.NewRefreshToken()
	if err != nil {
		return "", apperr.Wrap(apperr.Internal("Failed to create reset token."), err)
	}

	if _, err := s.db.Queries.CreateAuthToken(ctx, sqlcdb.CreateAuthTokenParams{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenHash: hash,
		Purpose:   "password_reset",
		ExpiresAt: time.Now().UTC().Add(time.Hour),
	}); err != nil {
		return "", apperr.Wrap(apperr.Internal("Failed to store reset token."), err)
	}

	_ = s.writeAudit(ctx, &user.ID, "auth.password_reset_requested", "user", user.ID.String(), RequestMeta{}, nil)

	if s.cfg.IsDevelopment() {
		return raw, nil
	}

	return "", nil
}

func (s *Service) ResetPassword(ctx context.Context, rawToken, newPassword string) error {
	if s.db == nil {
		return apperr.Internal("Database is unavailable.")
	}

	if err := password.Validate(newPassword); err != nil {
		return err
	}

	authToken, err := s.db.Queries.GetAuthTokenByHash(ctx, token.HashOpaqueToken(rawToken))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return apperr.BadRequest("Invalid or expired reset token.")
		}
		return apperr.Wrap(apperr.Internal("Failed to reset password."), err)
	}

	if authToken.Purpose != "password_reset" || authToken.UsedAt != nil || authToken.ExpiresAt.Before(time.Now().UTC()) {
		return apperr.BadRequest("Invalid or expired reset token.")
	}

	hash, err := password.Hash(newPassword)
	if err != nil {
		return apperr.Wrap(apperr.Internal("Failed to secure password."), err)
	}

	if err := s.db.Queries.UpdateUserPassword(ctx, sqlcdb.UpdateUserPasswordParams{
		ID:           authToken.UserID,
		PasswordHash: hash,
	}); err != nil {
		return apperr.Wrap(apperr.Internal("Failed to update password."), err)
	}

	if err := s.db.Queries.MarkAuthTokenUsed(ctx, authToken.ID); err != nil {
		return apperr.Wrap(apperr.Internal("Failed to consume reset token."), err)
	}

	if err := s.db.Queries.RevokeUserSessions(ctx, authToken.UserID); err != nil {
		return apperr.Wrap(apperr.Internal("Failed to revoke sessions."), err)
	}

	_ = s.writeAudit(ctx, &authToken.UserID, "auth.password_reset", "user", authToken.UserID.String(), RequestMeta{}, nil)
	return nil
}

func (s *Service) ParseAccessToken(accessToken string) (*token.AccessClaims, error) {
	return s.access.Parse(accessToken)
}

func (s *Service) issueSession(ctx context.Context, user sqlcdb.User, meta RequestMeta) (*AuthResult, error) {
	roles, permissions, err := s.loadRBAC(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	refreshRaw, refreshHash, err := token.NewRefreshToken()
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to create refresh token."), err)
	}

	sessionID := uuid.New()
	expiresAt := time.Now().UTC().Add(s.cfg.JWT.RefreshTTL)
	if _, err := s.db.Queries.CreateSession(ctx, sqlcdb.CreateSessionParams{
		ID:               sessionID,
		UserID:           user.ID,
		RefreshTokenHash: refreshHash,
		UserAgent:        meta.UserAgent,
		IpAddress:        meta.IPAddress,
		ExpiresAt:        expiresAt,
	}); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to create session."), err)
	}

	accessToken, accessExpires, err := s.access.Issue(user.ID, user.Email, sessionID.String(), roles, permissions)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to create access token."), err)
	}

	return &AuthResult{
		AccessToken:          accessToken,
		AccessTokenExpiresAt: &accessExpires,
		RefreshToken:         refreshRaw,
		User: UserDTO{
			ID:          user.ID.String(),
			Email:       user.Email,
			FullName:    user.FullName,
			Status:      user.Status,
			Roles:       roles,
			Permissions: permissions,
		},
	}, nil
}

func (s *Service) loadRBAC(ctx context.Context, userID uuid.UUID) ([]string, []string, error) {
	roles, err := s.db.Queries.ListUserRoleCodes(ctx, userID)
	if err != nil {
		return nil, nil, apperr.Wrap(apperr.Internal("Failed to load roles."), err)
	}

	permissions, err := s.db.Queries.ListUserPermissionCodes(ctx, userID)
	if err != nil {
		return nil, nil, apperr.Wrap(apperr.Internal("Failed to load permissions."), err)
	}

	return roles, permissions, nil
}

func (s *Service) writeAudit(
	ctx context.Context,
	actor *uuid.UUID,
	action, resourceType, resourceID string,
	meta RequestMeta,
	payload map[string]any,
) error {
	if s.db == nil {
		return nil
	}

	if payload == nil {
		payload = map[string]any{}
	}

	metadata, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("encode audit metadata: %w", err)
	}

	var resourceIDPtr *string
	if resourceID != "" {
		resourceIDPtr = &resourceID
	}

	return s.db.Queries.CreateAuditLog(ctx, sqlcdb.CreateAuditLogParams{
		ID:           uuid.New(),
		ActorUserID:  actor,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceIDPtr,
		IpAddress:    meta.IPAddress,
		UserAgent:    meta.UserAgent,
		Metadata:     metadata,
	})
}

func RefreshCookieName() string {
	return refreshCookieName
}
