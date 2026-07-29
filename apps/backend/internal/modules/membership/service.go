package membership

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database/sqlcdb"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type Service struct {
	db                     *database.Postgres
	lifetimePointsProvider func(ctx context.Context, userID uuid.UUID) (int64, error)
}

func (s *Service) SetLifetimePointsProvider(fn func(ctx context.Context, userID uuid.UUID) (int64, error)) {
	s.lifetimePointsProvider = fn
}

type QualificationRules struct {
	MinCompletedReservations int64   `json:"minCompletedReservations"`
	MinLifetimeLoyaltyPoints  int64   `json:"minLifetimeLoyaltyPoints"`
	LoyaltyPointMultiplier   float64 `json:"loyaltyPointMultiplier"`
}

type LevelDTO struct {
	ID                  string             `json:"id"`
	Code                string             `json:"code"`
	Name                string             `json:"name"`
	Description         string             `json:"description"`
	Rank                int32              `json:"rank"`
	QualificationRules  QualificationRules `json:"qualificationRules"`
	IsActive            bool               `json:"isActive"`
	SortOrder           int32              `json:"sortOrder"`
}

type BenefitDTO struct {
	ID          string         `json:"id"`
	LevelID     *string        `json:"levelId,omitempty"`
	Code        string         `json:"code"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	Data        map[string]any `json:"data"`
	SortOrder   int32          `json:"sortOrder"`
}

type ProgressDTO struct {
	CompletedReservations    int64 `json:"completedReservations"`
	LifetimeLoyaltyPoints     int64 `json:"lifetimeLoyaltyPoints"`
	NextLevelCode            string `json:"nextLevelCode,omitempty"`
	NextLevelName            string `json:"nextLevelName,omitempty"`
	ReservationsRemaining    *int64 `json:"reservationsRemaining,omitempty"`
}

type MembershipDTO struct {
	ID               string      `json:"id"`
	MembershipNumber string      `json:"membershipNumber"`
	Status           string      `json:"status"`
	QRPayload        string      `json:"qrPayload"`
	JoinedAt         string      `json:"joinedAt"`
	ExpiresAt        *string     `json:"expiresAt,omitempty"`
	Level            LevelDTO    `json:"level"`
	Progress         ProgressDTO `json:"progress"`
	UserID           string      `json:"userId,omitempty"`
	UserEmail        string      `json:"userEmail,omitempty"`
	UserFullName     string      `json:"userFullName,omitempty"`
}

type HistoryDTO struct {
	ID            string  `json:"id"`
	FromLevelCode *string `json:"fromLevelCode,omitempty"`
	FromLevelName *string `json:"fromLevelName,omitempty"`
	ToLevelCode   string  `json:"toLevelCode"`
	ToLevelName   string  `json:"toLevelName"`
	FromStatus    *string `json:"fromStatus,omitempty"`
	ToStatus      *string `json:"toStatus,omitempty"`
	Reason        string  `json:"reason"`
	TriggerSource string  `json:"triggerSource"`
	CreatedAt     string  `json:"createdAt"`
}

func NewService(db *database.Postgres) *Service {
	return &Service{db: db}
}

func (s *Service) ListPublicLevels(ctx context.Context) ([]LevelDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	items, err := s.db.Queries.ListActiveMembershipLevels(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to list membership levels."), err)
	}
	return mapLevels(items)
}

func (s *Service) ListPublicBenefits(ctx context.Context) ([]BenefitDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	items, err := s.db.Queries.ListAllActiveMembershipBenefits(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to list membership benefits."), err)
	}
	return mapBenefits(items)
}

func (s *Service) GetCustomerMembership(ctx context.Context, userID uuid.UUID) (*MembershipDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	if _, err := s.EnsureMembership(ctx, userID); err != nil {
		return nil, err
	}
	if _, err := s.EvaluateForUser(ctx, userID, "system", nil, "Automatic qualification evaluation"); err != nil {
		return nil, err
	}
	return s.buildMembershipDTO(ctx, userID)
}

func (s *Service) GetCustomerBenefits(ctx context.Context, userID uuid.UUID) ([]BenefitDTO, error) {
	membership, err := s.GetCustomerMembership(ctx, userID)
	if err != nil {
		return nil, err
	}
	levelID, err := uuid.Parse(membership.Level.ID)
	if err != nil {
		return nil, apperr.Internal("Invalid membership level.")
	}
	items, err := s.db.Queries.ListActiveMembershipBenefits(ctx, &levelID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to list benefits."), err)
	}
	return mapBenefits(items)
}

func (s *Service) GetCustomerHistory(ctx context.Context, userID uuid.UUID) ([]HistoryDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	raw, err := s.db.Queries.GetMembershipByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return []HistoryDTO{}, nil
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load membership."), err)
	}
	return s.listHistory(ctx, raw.ID)
}

func (s *Service) EnsureMembership(ctx context.Context, userID uuid.UUID) (*sqlcdb.Membership, error) {
	existing, err := s.db.Queries.GetMembershipByUserID(ctx, userID)
	if err == nil {
		return &existing, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, apperr.Wrap(apperr.Internal("Failed to load membership."), err)
	}

	bronze, err := s.db.Queries.GetMembershipLevelByCode(ctx, "bronze")
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Bronze membership level is not configured."), err)
	}

	number, err := generateMembershipNumber()
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to create membership number."), err)
	}
	qrToken, err := generateQRToken()
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to create membership QR token."), err)
	}

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to start membership transaction."), err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	qtx := s.db.Queries.WithTx(tx)

	created, err := qtx.CreateMembership(ctx, sqlcdb.CreateMembershipParams{
		ID:               uuid.New(),
		UserID:           userID,
		MembershipNumber: number,
		LevelID:          bronze.ID,
		Status:           "active",
		QrToken:          qrToken,
		JoinedAt:         time.Now().UTC(),
		ExpiresAt:        nil,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to create membership."), err)
	}

	if err := qtx.CreateMembershipHistory(ctx, sqlcdb.CreateMembershipHistoryParams{
		ID:            uuid.New(),
		MembershipID:  created.ID,
		FromLevelID:   nil,
		ToLevelID:     bronze.ID,
		FromStatus:    nil,
		ToStatus:      strPtr("active"),
		Reason:        "Initial Bronze enrollment",
		TriggerSource: "system",
		ActorUserID:   &userID,
	}); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to write membership history."), err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to commit membership."), err)
	}

	_ = s.writeAudit(ctx, &userID, "membership.enrolled", created.ID.String(), map[string]any{
		"level": "bronze",
	})

	return &created, nil
}

func (s *Service) EvaluateForUser(
	ctx context.Context,
	userID uuid.UUID,
	triggerSource string,
	actor *uuid.UUID,
	reason string,
) (*MembershipDTO, error) {
	membership, err := s.EnsureMembership(ctx, userID)
	if err != nil {
		return nil, err
	}
	if membership.Status != "active" {
		return s.buildMembershipDTO(ctx, userID)
	}

	levels, err := s.db.Queries.ListActiveMembershipLevels(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load membership levels."), err)
	}

	completed, err := s.db.Queries.CountCompletedReservationsByUser(ctx, &userID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load qualification metrics."), err)
	}

	// Loyalty points arrive from the loyalty module when wired.
	lifetimePoints := int64(0)
	if s.lifetimePointsProvider != nil {
		points, pointsErr := s.lifetimePointsProvider(ctx, userID)
		if pointsErr != nil {
			return nil, pointsErr
		}
		lifetimePoints = points
	}

	var target *sqlcdb.MembershipLevel
	for i := range levels {
		level := levels[i]
		rules, err := decodeRules(level.QualificationRules)
		if err != nil {
			return nil, apperr.Internal("Invalid qualification rules configuration.")
		}
		if completed >= rules.MinCompletedReservations && lifetimePoints >= rules.MinLifetimeLoyaltyPoints {
			target = &level
		}
	}
	if target == nil {
		return s.buildMembershipDTO(ctx, userID)
	}

	currentLevel, err := s.db.Queries.GetMembershipLevelByID(ctx, membership.LevelID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load current membership level."), err)
	}

	if target.Rank <= currentLevel.Rank {
		return s.buildMembershipDTO(ctx, userID)
	}

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to start upgrade transaction."), err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	qtx := s.db.Queries.WithTx(tx)

	updated, err := qtx.UpdateMembershipLevel(ctx, sqlcdb.UpdateMembershipLevelParams{
		ID:      membership.ID,
		LevelID: target.ID,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to upgrade membership."), err)
	}

	fromLevelID := membership.LevelID
	if err := qtx.CreateMembershipHistory(ctx, sqlcdb.CreateMembershipHistoryParams{
		ID:            uuid.New(),
		MembershipID:  membership.ID,
		FromLevelID:   &fromLevelID,
		ToLevelID:     target.ID,
		FromStatus:    strPtr(membership.Status),
		ToStatus:      strPtr(membership.Status),
		Reason:        reason,
		TriggerSource: triggerSource,
		ActorUserID:   actor,
	}); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to write membership history."), err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to commit membership upgrade."), err)
	}

	_ = updated
	_ = s.writeAudit(ctx, actor, "membership.upgraded", membership.ID.String(), map[string]any{
		"from": currentLevel.Code,
		"to":   target.Code,
	})

	return s.buildMembershipDTO(ctx, userID)
}

func (s *Service) ListAdmin(ctx context.Context, status, levelID string, page, limit int) ([]MembershipDTO, int64, error) {
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
	if strings.TrimSpace(status) != "" {
		normalized := strings.TrimSpace(status)
		statusPtr = &normalized
	}
	var levelPtr *uuid.UUID
	if strings.TrimSpace(levelID) != "" {
		parsed, err := uuid.Parse(levelID)
		if err != nil {
			return nil, 0, apperr.Validation("Invalid level id.", response.FieldError{Field: "levelId", Message: "must be a UUID"})
		}
		levelPtr = &parsed
	}

	total, err := s.db.Queries.CountMembershipsAdmin(ctx, sqlcdb.CountMembershipsAdminParams{
		Status:  statusPtr,
		LevelID: levelPtr,
	})
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Failed to count memberships."), err)
	}

	rows, err := s.db.Queries.ListMembershipsAdmin(ctx, sqlcdb.ListMembershipsAdminParams{
		Limit:   int32(limit),
		Offset:  int32((page - 1) * limit),
		Status:  statusPtr,
		LevelID: levelPtr,
	})
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Failed to list memberships."), err)
	}

	result := make([]MembershipDTO, 0, len(rows))
	for _, row := range rows {
		levelRules, _ := decodeRules([]byte(`{}`))
		level, err := s.db.Queries.GetMembershipLevelByID(ctx, row.LevelID)
		if err == nil {
			levelRules, _ = decodeRules(level.QualificationRules)
		}
		dto := MembershipDTO{
			ID:               row.ID.String(),
			MembershipNumber: row.MembershipNumber,
			Status:           row.Status,
			QRPayload:        qrPayload(row.QrToken),
			JoinedAt:         row.JoinedAt.UTC().Format(time.RFC3339),
			UserID:           row.UserID.String(),
			UserEmail:        row.UserEmail,
			UserFullName:     row.UserFullName,
			Level: LevelDTO{
				ID:                 row.LevelID.String(),
				Code:               row.LevelCode,
				Name:               row.LevelName,
				Rank:               row.LevelRank,
				QualificationRules: levelRules,
				IsActive:           true,
			},
		}
		if row.ExpiresAt != nil {
			value := row.ExpiresAt.UTC().Format(time.RFC3339)
			dto.ExpiresAt = &value
		}
		result = append(result, dto)
	}

	return result, total, nil
}

func (s *Service) GetAdmin(ctx context.Context, membershipID uuid.UUID) (*MembershipDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	raw, err := s.db.Queries.GetMembershipByID(ctx, membershipID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Membership not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load membership."), err)
	}
	return s.buildMembershipDTO(ctx, raw.UserID)
}

func (s *Service) UpdateStatus(ctx context.Context, membershipID, actorID uuid.UUID, status, reason string) (*MembershipDTO, error) {
	status = strings.TrimSpace(strings.ToLower(status))
	switch status {
	case "active", "inactive", "suspended", "expired":
	default:
		return nil, apperr.Validation("Invalid membership status.", response.FieldError{
			Field:   "status",
			Message: "must be active, inactive, suspended, or expired",
		})
	}

	raw, err := s.db.Queries.GetMembershipByID(ctx, membershipID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Membership not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load membership."), err)
	}

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to start status transaction."), err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	qtx := s.db.Queries.WithTx(tx)

	updated, err := qtx.UpdateMembershipStatus(ctx, sqlcdb.UpdateMembershipStatusParams{
		ID:     membershipID,
		Status: status,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to update membership status."), err)
	}

	fromStatus := raw.Status
	if err := qtx.CreateMembershipHistory(ctx, sqlcdb.CreateMembershipHistoryParams{
		ID:            uuid.New(),
		MembershipID:  membershipID,
		FromLevelID:   &raw.LevelID,
		ToLevelID:     raw.LevelID,
		FromStatus:    &fromStatus,
		ToStatus:      &status,
		Reason:        strings.TrimSpace(reason),
		TriggerSource: "admin",
		ActorUserID:   &actorID,
	}); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to write membership history."), err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to commit membership status."), err)
	}

	_ = updated
	_ = s.writeAudit(ctx, &actorID, "membership.status_changed", membershipID.String(), map[string]any{
		"from": raw.Status,
		"to":   status,
	})

	return s.buildMembershipDTO(ctx, raw.UserID)
}

func (s *Service) ManualLevelChange(ctx context.Context, membershipID, levelID, actorID uuid.UUID, reason string) (*MembershipDTO, error) {
	raw, err := s.db.Queries.GetMembershipByID(ctx, membershipID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Membership not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load membership."), err)
	}

	target, err := s.db.Queries.GetMembershipLevelByID(ctx, levelID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Membership level not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load membership level."), err)
	}

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to start level change transaction."), err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	qtx := s.db.Queries.WithTx(tx)

	if _, err := qtx.UpdateMembershipLevel(ctx, sqlcdb.UpdateMembershipLevelParams{
		ID:      membershipID,
		LevelID: target.ID,
	}); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to update membership level."), err)
	}

	fromLevelID := raw.LevelID
	if err := qtx.CreateMembershipHistory(ctx, sqlcdb.CreateMembershipHistoryParams{
		ID:            uuid.New(),
		MembershipID:  membershipID,
		FromLevelID:   &fromLevelID,
		ToLevelID:     target.ID,
		FromStatus:    strPtr(raw.Status),
		ToStatus:      strPtr(raw.Status),
		Reason:        firstNonEmpty(strings.TrimSpace(reason), "Manual level adjustment"),
		TriggerSource: "admin",
		ActorUserID:   &actorID,
	}); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to write membership history."), err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to commit membership level change."), err)
	}

	_ = s.writeAudit(ctx, &actorID, "membership.level_changed", membershipID.String(), map[string]any{
		"to": target.Code,
	})

	return s.buildMembershipDTO(ctx, raw.UserID)
}

func (s *Service) ListAdminLevels(ctx context.Context) ([]LevelDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	items, err := s.db.Queries.ListMembershipLevelsAdmin(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to list membership levels."), err)
	}
	return mapLevels(items)
}

func (s *Service) UpdateLevel(ctx context.Context, levelID uuid.UUID, rules QualificationRules, description *string, isActive *bool) (*LevelDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	if rules.MinCompletedReservations < 0 || rules.MinLifetimeLoyaltyPoints < 0 {
		return nil, apperr.Validation("Qualification thresholds cannot be negative.")
	}
	payload, err := json.Marshal(rules)
	if err != nil {
		return nil, apperr.Internal("Failed to encode qualification rules.")
	}

	params := sqlcdb.UpdateMembershipLevelRulesParams{
		ID:                 levelID,
		QualificationRules: payload,
		Description:        description,
		IsActive:           pgtype.Bool{Valid: false},
	}
	if isActive != nil {
		params.IsActive = pgtype.Bool{Bool: *isActive, Valid: true}
	}

	updated, err := s.db.Queries.UpdateMembershipLevelRules(ctx, params)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Membership level not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to update membership level."), err)
	}

	dto, err := toLevelDTO(updated)
	if err != nil {
		return nil, err
	}
	return &dto, nil
}

func (s *Service) GetAdminHistory(ctx context.Context, membershipID uuid.UUID) ([]HistoryDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	if _, err := s.db.Queries.GetMembershipByID(ctx, membershipID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Membership not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load membership."), err)
	}
	return s.listHistory(ctx, membershipID)
}

func (s *Service) buildMembershipDTO(ctx context.Context, userID uuid.UUID) (*MembershipDTO, error) {
	raw, err := s.db.Queries.GetMembershipByUserID(ctx, userID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load membership."), err)
	}
	level, err := s.db.Queries.GetMembershipLevelByID(ctx, raw.LevelID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load membership level."), err)
	}
	levelDTO, err := toLevelDTO(level)
	if err != nil {
		return nil, err
	}

	completed, err := s.db.Queries.CountCompletedReservationsByUser(ctx, &userID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load qualification progress."), err)
	}

	progress := ProgressDTO{
		CompletedReservations: completed,
		LifetimeLoyaltyPoints:  0,
	}
	if s.lifetimePointsProvider != nil {
		if points, pointsErr := s.lifetimePointsProvider(ctx, userID); pointsErr == nil {
			progress.LifetimeLoyaltyPoints = points
		}
	}

	levels, err := s.db.Queries.ListActiveMembershipLevels(ctx)
	if err == nil {
		for _, candidate := range levels {
			if candidate.Rank <= level.Rank {
				continue
			}
			rules, decodeErr := decodeRules(candidate.QualificationRules)
			if decodeErr != nil {
				continue
			}
			progress.NextLevelCode = candidate.Code
			progress.NextLevelName = candidate.Name
			remaining := rules.MinCompletedReservations - completed
			if remaining < 0 {
				remaining = 0
			}
			progress.ReservationsRemaining = &remaining
			break
		}
	}

	dto := &MembershipDTO{
		ID:               raw.ID.String(),
		MembershipNumber: raw.MembershipNumber,
		Status:           raw.Status,
		QRPayload:        qrPayload(raw.QrToken),
		JoinedAt:         raw.JoinedAt.UTC().Format(time.RFC3339),
		Level:            levelDTO,
		Progress:         progress,
		UserID:           raw.UserID.String(),
	}
	if raw.ExpiresAt != nil {
		value := raw.ExpiresAt.UTC().Format(time.RFC3339)
		dto.ExpiresAt = &value
	}
	return dto, nil
}

func (s *Service) listHistory(ctx context.Context, membershipID uuid.UUID) ([]HistoryDTO, error) {
	rows, err := s.db.Queries.ListMembershipHistories(ctx, membershipID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to list membership history."), err)
	}
	result := make([]HistoryDTO, 0, len(rows))
	for _, row := range rows {
		result = append(result, HistoryDTO{
			ID:            row.ID.String(),
			FromLevelCode: row.FromLevelCode,
			FromLevelName: row.FromLevelName,
			ToLevelCode:   row.ToLevelCode,
			ToLevelName:   row.ToLevelName,
			FromStatus:    row.FromStatus,
			ToStatus:      row.ToStatus,
			Reason:        row.Reason,
			TriggerSource: row.TriggerSource,
			CreatedAt:     row.CreatedAt.UTC().Format(time.RFC3339),
		})
	}
	return result, nil
}

func mapLevels(items []sqlcdb.MembershipLevel) ([]LevelDTO, error) {
	result := make([]LevelDTO, 0, len(items))
	for _, item := range items {
		dto, err := toLevelDTO(item)
		if err != nil {
			return nil, err
		}
		result = append(result, dto)
	}
	return result, nil
}

func toLevelDTO(item sqlcdb.MembershipLevel) (LevelDTO, error) {
	rules, err := decodeRules(item.QualificationRules)
	if err != nil {
		return LevelDTO{}, apperr.Internal("Invalid qualification rules configuration.")
	}
	return LevelDTO{
		ID:                 item.ID.String(),
		Code:               item.Code,
		Name:               item.Name,
		Description:        item.Description,
		Rank:               item.Rank,
		QualificationRules: rules,
		IsActive:           item.IsActive,
		SortOrder:          item.SortOrder,
	}, nil
}

func mapBenefits(items []sqlcdb.MembershipBenefit) ([]BenefitDTO, error) {
	result := make([]BenefitDTO, 0, len(items))
	for _, item := range items {
		data := map[string]any{}
		if len(item.Data) > 0 {
			if err := json.Unmarshal(item.Data, &data); err != nil {
				return nil, apperr.Internal("Invalid benefit configuration.")
			}
		}
		dto := BenefitDTO{
			ID:          item.ID.String(),
			Code:        item.Code,
			Title:       item.Title,
			Description: item.Description,
			Data:        data,
			SortOrder:   item.SortOrder,
		}
		if item.LevelID != nil {
			id := item.LevelID.String()
			dto.LevelID = &id
		}
		result = append(result, dto)
	}
	return result, nil
}

func decodeRules(raw []byte) (QualificationRules, error) {
	var rules QualificationRules
	if len(raw) == 0 {
		rules.LoyaltyPointMultiplier = 1
		return rules, nil
	}
	if err := json.Unmarshal(raw, &rules); err != nil {
		return QualificationRules{}, err
	}
	if rules.LoyaltyPointMultiplier <= 0 {
		rules.LoyaltyPointMultiplier = 1
	}
	return rules, nil
}

func generateMembershipNumber() (string, error) {
	bytes := make([]byte, 3)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return fmt.Sprintf("7OZ-M-%s-%s", time.Now().UTC().Format("200601"), strings.ToUpper(hex.EncodeToString(bytes))), nil
}

func generateQRToken() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func qrPayload(token string) string {
	return "7oz-member:" + token
}

func strPtr(value string) *string {
	return &value
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
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
		ResourceType: "membership",
		ResourceID:   resourceIDPtr,
		IpAddress:    "",
		UserAgent:    "",
		Metadata:     metadata,
	})
}
