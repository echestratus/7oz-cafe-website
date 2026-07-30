package customer

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database/sqlcdb"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Service struct {
	db *database.Postgres
}

type CustomerDTO struct {
	ID              string                     `json:"id"`
	Email           string                     `json:"email"`
	FullName        string                     `json:"fullName"`
	Status          string                     `json:"status"`
	Roles           []string                   `json:"roles"`
	EmailVerified   bool                       `json:"emailVerified"`
	EmailVerifiedAt *string                    `json:"emailVerifiedAt,omitempty"`
	LastLoginAt     *string                    `json:"lastLoginAt,omitempty"`
	CreatedAt       string                     `json:"createdAt"`
	UpdatedAt       string                     `json:"updatedAt"`
	Membership      *CustomerMembershipSummary `json:"membership,omitempty"`
	Loyalty         *CustomerLoyaltySummary    `json:"loyalty,omitempty"`
}

type CustomerMembershipSummary struct {
	ID               string `json:"id"`
	MembershipNumber string `json:"membershipNumber"`
	Status           string `json:"status"`
	LevelCode        string `json:"levelCode"`
	LevelName        string `json:"levelName"`
}

type CustomerLoyaltySummary struct {
	Balance          int32 `json:"balance"`
	LifetimeEarned   int32 `json:"lifetimeEarned"`
	LifetimeRedeemed int32 `json:"lifetimeRedeemed"`
}

func NewService(db *database.Postgres) *Service {
	return &Service{db: db}
}

func (s *Service) ListAdmin(ctx context.Context, status, search string, page, limit int) ([]CustomerDTO, int64, error) {
	if err := s.requireDB(); err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var statusPtr *string
	if trimmed := strings.TrimSpace(status); trimmed != "" {
		statusPtr = &trimmed
	}
	var searchPtr *string
	if trimmed := strings.TrimSpace(search); trimmed != "" {
		searchPtr = &trimmed
	}

	total, err := s.db.Queries.CountCustomersAdmin(ctx, sqlcdb.CountCustomersAdminParams{
		Status: statusPtr,
		Search: searchPtr,
	})
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Failed to count customers."), err)
	}

	rows, err := s.db.Queries.ListCustomersAdmin(ctx, sqlcdb.ListCustomersAdminParams{
		Limit:  int32(limit),
		Offset: int32((page - 1) * limit),
		Status: statusPtr,
		Search: searchPtr,
	})
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Failed to list customers."), err)
	}

	items := make([]CustomerDTO, 0, len(rows))
	for _, row := range rows {
		dto, err := s.mapListRow(ctx, row)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, dto)
	}
	return items, total, nil
}

func (s *Service) GetAdmin(ctx context.Context, userID uuid.UUID) (*CustomerDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	user, err := s.db.Queries.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Customer not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load customer."), err)
	}

	hasCustomer, err := s.db.Queries.UserHasRoleCode(ctx, sqlcdb.UserHasRoleCodeParams{
		UserID: userID,
		Code:   "customer",
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to verify customer role."), err)
	}
	if !hasCustomer {
		return nil, apperr.NotFound("Customer not found.")
	}

	dto, err := s.mapUser(ctx, user, true)
	if err != nil {
		return nil, err
	}
	return &dto, nil
}

func (s *Service) UpdateStatus(ctx context.Context, userID, actorID uuid.UUID, status, reason string) (*CustomerDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	status = strings.TrimSpace(strings.ToLower(status))
	switch status {
	case "active", "suspended", "inactive":
	default:
		return nil, apperr.Validation("Invalid status.", response.FieldError{
			Field:   "status",
			Message: "must be active, suspended, or inactive",
		})
	}

	existing, err := s.GetAdmin(ctx, userID)
	if err != nil {
		return nil, err
	}

	updated, err := s.db.Queries.UpdateUserStatus(ctx, sqlcdb.UpdateUserStatusParams{
		ID:     userID,
		Status: status,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to update customer status."), err)
	}

	_ = s.writeAudit(ctx, &actorID, "customer.status_updated", userID.String(), map[string]any{
		"from":   existing.Status,
		"to":     status,
		"reason": strings.TrimSpace(reason),
	})

	dto, err := s.mapUser(ctx, updated, true)
	if err != nil {
		return nil, err
	}
	return &dto, nil
}

func (s *Service) mapListRow(ctx context.Context, row sqlcdb.ListCustomersAdminRow) (CustomerDTO, error) {
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
	return s.mapUser(ctx, user, false)
}

func (s *Service) mapUser(ctx context.Context, user sqlcdb.User, withSummaries bool) (CustomerDTO, error) {
	roles, err := s.db.Queries.ListUserRoleCodes(ctx, user.ID)
	if err != nil {
		return CustomerDTO{}, apperr.Wrap(apperr.Internal("Failed to load customer roles."), err)
	}

	dto := CustomerDTO{
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

	if !withSummaries {
		return dto, nil
	}

	membership, err := s.db.Queries.GetMembershipByUserID(ctx, user.ID)
	if err == nil {
		levelCode := ""
		levelName := ""
		if level, levelErr := s.db.Queries.GetMembershipLevelByID(ctx, membership.LevelID); levelErr == nil {
			levelCode = level.Code
			levelName = level.Name
		}
		dto.Membership = &CustomerMembershipSummary{
			ID:               membership.ID.String(),
			MembershipNumber: membership.MembershipNumber,
			Status:           membership.Status,
			LevelCode:        levelCode,
			LevelName:        levelName,
		}
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return CustomerDTO{}, apperr.Wrap(apperr.Internal("Failed to load membership summary."), err)
	}

	loyalty, err := s.db.Queries.GetLoyaltyAccountByUserID(ctx, user.ID)
	if err == nil {
		dto.Loyalty = &CustomerLoyaltySummary{
			Balance:          loyalty.Balance,
			LifetimeEarned:   loyalty.LifetimeEarned,
			LifetimeRedeemed: loyalty.LifetimeRedeemed,
		}
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return CustomerDTO{}, apperr.Wrap(apperr.Internal("Failed to load loyalty summary."), err)
	}

	return dto, nil
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
		ResourceType: "customer",
		ResourceID:   resourceIDPtr,
		IpAddress:    "",
		UserAgent:    "",
		Metadata:     metadata,
	})
}
