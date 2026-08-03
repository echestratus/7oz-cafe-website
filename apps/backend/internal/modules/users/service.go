package users

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database/sqlcdb"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/security/password"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

const (
	roleAdmin      = "admin"
	roleSuperAdmin = "super_admin"
)

type Service struct {
	db *database.Postgres
}

type StaffUserDTO struct {
	ID              string   `json:"id"`
	Email           string   `json:"email"`
	FullName        string   `json:"fullName"`
	Status          string   `json:"status"`
	Roles           []string `json:"roles"`
	EmailVerified   bool     `json:"emailVerified"`
	EmailVerifiedAt *string  `json:"emailVerifiedAt,omitempty"`
	LastLoginAt     *string  `json:"lastLoginAt,omitempty"`
	CreatedAt       string   `json:"createdAt"`
	UpdatedAt       string   `json:"updatedAt"`
}

type RoleDTO struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type CreateStaffInput struct {
	Email     string
	FullName  string
	Password  string
	RoleCode  string
	ActorID   uuid.UUID
}

type UpdateStatusInput struct {
	UserID  uuid.UUID
	ActorID uuid.UUID
	Status  string
	Reason  string
}

type UpdateRoleInput struct {
	UserID   uuid.UUID
	ActorID  uuid.UUID
	RoleCode string
}

func NewService(db *database.Postgres) *Service {
	return &Service{db: db}
}

func (s *Service) ListStaff(ctx context.Context, status, roleCode, search string, page, limit int) ([]StaffUserDTO, int64, error) {
	if err := s.requireDB(); err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	statusPtr := optionalTrimmed(status)
	rolePtr, err := optionalStaffRole(roleCode)
	if err != nil {
		return nil, 0, err
	}
	searchPtr := optionalTrimmed(search)

	total, err := s.db.Queries.CountStaffUsersAdmin(ctx, sqlcdb.CountStaffUsersAdminParams{
		Status:   statusPtr,
		RoleCode: rolePtr,
		Search:   searchPtr,
	})
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Failed to count staff users."), err)
	}

	rows, err := s.db.Queries.ListStaffUsersAdmin(ctx, sqlcdb.ListStaffUsersAdminParams{
		Limit:    int32(limit),
		Offset:   int32((page - 1) * limit),
		Status:   statusPtr,
		RoleCode: rolePtr,
		Search:   searchPtr,
	})
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Failed to list staff users."), err)
	}

	items := make([]StaffUserDTO, 0, len(rows))
	for _, row := range rows {
		dto, mapErr := s.mapListRow(ctx, row)
		if mapErr != nil {
			return nil, 0, mapErr
		}
		items = append(items, dto)
	}
	return items, total, nil
}

func (s *Service) GetStaff(ctx context.Context, userID uuid.UUID) (*StaffUserDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	user, err := s.db.Queries.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Staff user not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load staff user."), err)
	}

	isStaff, err := s.db.Queries.UserIsStaff(ctx, userID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to verify staff role."), err)
	}
	if !isStaff {
		return nil, apperr.NotFound("Staff user not found.")
	}

	dto, err := s.mapUser(ctx, user)
	if err != nil {
		return nil, err
	}
	return &dto, nil
}

func (s *Service) CreateStaff(ctx context.Context, input CreateStaffInput) (*StaffUserDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	fullName := strings.TrimSpace(input.FullName)
	email := strings.TrimSpace(strings.ToLower(input.Email))
	roleCode, err := requireStaffRole(input.RoleCode)
	if err != nil {
		return nil, err
	}

	var fieldErrors []response.FieldError
	if fullName == "" {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "fullName", Message: "is required"})
	}
	if email == "" {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "email", Message: "is required"})
	}
	if len(fieldErrors) > 0 {
		return nil, apperr.Validation("Invalid staff payload.", fieldErrors...)
	}
	if err := password.Validate(input.Password); err != nil {
		return nil, err
	}

	if _, err := s.db.Queries.GetUserByEmail(ctx, email); err == nil {
		return nil, apperr.Conflict("An account with this email already exists.")
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return nil, apperr.Wrap(apperr.Internal("Failed to create staff user."), err)
	}

	role, err := s.db.Queries.GetRoleByCode(ctx, roleCode)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.Validation("Invalid role.", response.FieldError{
				Field:   "roleCode",
				Message: "must be admin or super_admin",
			})
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load role."), err)
	}

	if roleCode == roleSuperAdmin {
		perms, permErr := s.db.Queries.ListUserPermissionCodes(ctx, input.ActorID)
		if permErr != nil {
			return nil, apperr.Wrap(apperr.Internal("Failed to verify permissions."), permErr)
		}
		if !containsString(perms, "role.manage") {
			return nil, apperr.Forbidden("Assigning super_admin requires role.manage.")
		}
	}

	hash, err := password.Hash(input.Password)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to secure password."), err)
	}

	now := time.Now().UTC()
	userID := uuid.New()
	user, err := s.db.Queries.CreateUser(ctx, sqlcdb.CreateUserParams{
		ID:              userID,
		Email:           email,
		PasswordHash:    hash,
		FullName:        fullName,
		Status:          "active",
		EmailVerifiedAt: &now,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to create staff user."), err)
	}

	if err := s.db.Queries.AssignUserRole(ctx, sqlcdb.AssignUserRoleParams{
		UserID: user.ID,
		RoleID: role.ID,
	}); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to assign staff role."), err)
	}

	_ = s.writeAudit(ctx, &input.ActorID, "staff.created", user.ID.String(), map[string]any{
		"email":    user.Email,
		"roleCode": roleCode,
	})

	dto, err := s.mapUser(ctx, user)
	if err != nil {
		return nil, err
	}
	return &dto, nil
}

func (s *Service) UpdateStatus(ctx context.Context, input UpdateStatusInput) (*StaffUserDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	status := strings.TrimSpace(strings.ToLower(input.Status))
	switch status {
	case "active", "suspended", "inactive":
	default:
		return nil, apperr.Validation("Invalid status.", response.FieldError{
			Field:   "status",
			Message: "must be active, suspended, or inactive",
		})
	}

	if input.UserID == input.ActorID {
		return nil, apperr.Validation("You cannot change your own account status.")
	}

	existing, err := s.GetStaff(ctx, input.UserID)
	if err != nil {
		return nil, err
	}

	updated, err := s.db.Queries.UpdateUserStatus(ctx, sqlcdb.UpdateUserStatusParams{
		ID:     input.UserID,
		Status: status,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to update staff status."), err)
	}

	_ = s.writeAudit(ctx, &input.ActorID, "staff.status_updated", input.UserID.String(), map[string]any{
		"from":   existing.Status,
		"to":     status,
		"reason": strings.TrimSpace(input.Reason),
	})

	dto, err := s.mapUser(ctx, updated)
	if err != nil {
		return nil, err
	}
	return &dto, nil
}

func (s *Service) UpdateRole(ctx context.Context, input UpdateRoleInput) (*StaffUserDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	roleCode, err := requireStaffRole(input.RoleCode)
	if err != nil {
		return nil, err
	}
	if input.UserID == input.ActorID {
		return nil, apperr.Validation("You cannot change your own role.")
	}

	existing, err := s.GetStaff(ctx, input.UserID)
	if err != nil {
		return nil, err
	}

	role, err := s.db.Queries.GetRoleByCode(ctx, roleCode)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.Validation("Invalid role.", response.FieldError{
				Field:   "roleCode",
				Message: "must be admin or super_admin",
			})
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load role."), err)
	}

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to start role update."), err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	qtx := s.db.Queries.WithTx(tx)
	if err := qtx.DeleteUserStaffRoles(ctx, input.UserID); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to clear staff roles."), err)
	}
	if err := qtx.AssignUserRole(ctx, sqlcdb.AssignUserRoleParams{
		UserID: input.UserID,
		RoleID: role.ID,
	}); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to assign staff role."), err)
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to commit role update."), err)
	}

	_ = s.writeAudit(ctx, &input.ActorID, "staff.role_updated", input.UserID.String(), map[string]any{
		"from": existing.Roles,
		"to":   roleCode,
	})

	return s.GetStaff(ctx, input.UserID)
}

func (s *Service) ListAssignableRoles(ctx context.Context) ([]RoleDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	roles, err := s.db.Queries.ListRoles(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to list roles."), err)
	}

	items := make([]RoleDTO, 0, 2)
	for _, role := range roles {
		if role.Code != roleAdmin && role.Code != roleSuperAdmin {
			continue
		}
		items = append(items, RoleDTO{
			Code:        role.Code,
			Name:        role.Name,
			Description: role.Description,
		})
	}
	return items, nil
}

func (s *Service) mapListRow(ctx context.Context, row sqlcdb.ListStaffUsersAdminRow) (StaffUserDTO, error) {
	user := sqlcdb.User{
		ID:              row.ID,
		Email:           row.Email,
		FullName:        row.FullName,
		Status:          row.Status,
		EmailVerifiedAt: row.EmailVerifiedAt,
		LastLoginAt:     row.LastLoginAt,
		CreatedAt:       row.CreatedAt,
		UpdatedAt:       row.UpdatedAt,
	}
	return s.mapUser(ctx, user)
}

func (s *Service) mapUser(ctx context.Context, user sqlcdb.User) (StaffUserDTO, error) {
	roles, err := s.db.Queries.ListUserRoleCodes(ctx, user.ID)
	if err != nil {
		return StaffUserDTO{}, apperr.Wrap(apperr.Internal("Failed to load staff roles."), err)
	}

	dto := StaffUserDTO{
		ID:            user.ID.String(),
		Email:         user.Email,
		FullName:      user.FullName,
		Status:        user.Status,
		Roles:         roles,
		EmailVerified: user.EmailVerifiedAt != nil,
		CreatedAt:     user.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:     user.UpdatedAt.UTC().Format(time.RFC3339),
	}
	if user.EmailVerifiedAt != nil {
		value := user.EmailVerifiedAt.UTC().Format(time.RFC3339)
		dto.EmailVerifiedAt = &value
	}
	if user.LastLoginAt != nil {
		value := user.LastLoginAt.UTC().Format(time.RFC3339)
		dto.LastLoginAt = &value
	}
	return dto, nil
}

func requireStaffRole(roleCode string) (string, error) {
	code := strings.TrimSpace(strings.ToLower(roleCode))
	switch code {
	case roleAdmin, roleSuperAdmin:
		return code, nil
	default:
		return "", apperr.Validation("Invalid role.", response.FieldError{
			Field:   "roleCode",
			Message: "must be admin or super_admin",
		})
	}
}

func optionalStaffRole(roleCode string) (*string, error) {
	trimmed := strings.TrimSpace(roleCode)
	if trimmed == "" {
		return nil, nil
	}
	code, err := requireStaffRole(trimmed)
	if err != nil {
		return nil, err
	}
	return &code, nil
}

func optionalTrimmed(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func containsString(items []string, target string) bool {
	for _, item := range items {
		if item == target {
			return true
		}
	}
	return false
}

func (s *Service) requireDB() error {
	if s.db == nil {
		return apperr.Internal("Database is unavailable.")
	}
	return nil
}

func (s *Service) writeAudit(ctx context.Context, actor *uuid.UUID, action, resourceID string, payload map[string]any) error {
	if s.db == nil {
		return nil
	}
	if payload == nil {
		payload = map[string]any{}
	}
	metadata, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	var resourceIDPtr *string
	if resourceID != "" {
		resourceIDPtr = &resourceID
	}
	return s.db.Queries.CreateAuditLog(ctx, sqlcdb.CreateAuditLogParams{
		ID:           uuid.New(),
		ActorUserID:  actor,
		Action:       action,
		ResourceType: "staff_user",
		ResourceID:   resourceIDPtr,
		IpAddress:    "",
		UserAgent:    "",
		Metadata:     metadata,
	})
}
