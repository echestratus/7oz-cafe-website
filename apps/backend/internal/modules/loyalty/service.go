package loyalty

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strconv"
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
	db *database.Postgres
}

type AccountDTO struct {
	ID               string `json:"id"`
	UserID           string `json:"userId"`
	Balance          int32  `json:"balance"`
	LifetimeEarned   int32  `json:"lifetimeEarned"`
	LifetimeRedeemed int32  `json:"lifetimeRedeemed"`
	UserEmail        string `json:"userEmail,omitempty"`
	UserFullName     string `json:"userFullName,omitempty"`
	UpdatedAt        string `json:"updatedAt"`
}

type TransactionDTO struct {
	ID                string  `json:"id"`
	Type              string  `json:"type"`
	Points            int32   `json:"points"`
	BalanceAfter      int32   `json:"balanceAfter"`
	Source            string  `json:"source"`
	Description       string  `json:"description"`
	RelatedEntityType *string `json:"relatedEntityType,omitempty"`
	RelatedEntityID   *string `json:"relatedEntityId,omitempty"`
	CreatedAt         string  `json:"createdAt"`
	UserEmail         string  `json:"userEmail,omitempty"`
	UserFullName      string  `json:"userFullName,omitempty"`
}

type RewardDTO struct {
	ID          string         `json:"id"`
	Code        string         `json:"code"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	PointsCost  int32          `json:"pointsCost"`
	Stock       *int32         `json:"stock"`
	IsActive    bool           `json:"isActive"`
	SortOrder   int32          `json:"sortOrder"`
	Data        map[string]any `json:"data"`
}

type CampaignDTO struct {
	ID                 string   `json:"id"`
	Code               string   `json:"code"`
	Name               string   `json:"name"`
	Description        string   `json:"description"`
	StartsAt           string   `json:"startsAt"`
	EndsAt             string   `json:"endsAt"`
	PointMultiplier    float64  `json:"pointMultiplier"`
	BonusPoints        int32    `json:"bonusPoints"`
	EligibleLevelCodes []string `json:"eligibleLevelCodes"`
	IsActive           bool     `json:"isActive"`
}

type RedemptionDTO struct {
	ID          string     `json:"id"`
	RewardID    string     `json:"rewardId"`
	PointsSpent int32      `json:"pointsSpent"`
	Status      string     `json:"status"`
	CreatedAt   string     `json:"createdAt"`
	Account     AccountDTO `json:"account"`
	Reward      RewardDTO  `json:"reward"`
}

type AdjustInput struct {
	UserID uuid.UUID
	Points int32
	Reason string
	Actor  uuid.UUID
}

type RewardInput struct {
	Code        string
	Title       string
	Description string
	PointsCost  int32
	Stock       *int32
	IsActive    bool
	SortOrder   int32
	Data        map[string]any
}

type CampaignInput struct {
	Code               string
	Name               string
	Description        string
	StartsAt           time.Time
	EndsAt             time.Time
	PointMultiplier    float64
	BonusPoints        int32
	EligibleLevelCodes []string
	IsActive           bool
}

func NewService(db *database.Postgres) *Service {
	return &Service{db: db}
}

func (s *Service) GetCustomerAccount(ctx context.Context, userID uuid.UUID) (*AccountDTO, error) {
	account, err := s.ensureAccount(ctx, userID)
	if err != nil {
		return nil, err
	}
	dto := toAccountDTO(*account)
	return &dto, nil
}

func (s *Service) GetLifetimeEarnedPoints(ctx context.Context, userID uuid.UUID) (int64, error) {
	account, err := s.ensureAccount(ctx, userID)
	if err != nil {
		return 0, err
	}
	return int64(account.LifetimeEarned), nil
}

func (s *Service) ListCustomerHistory(ctx context.Context, userID uuid.UUID, page, limit int) ([]TransactionDTO, int64, error) {
	if err := s.requireDB(); err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	if _, err := s.ensureAccount(ctx, userID); err != nil {
		return nil, 0, err
	}
	total, err := s.db.Queries.CountLoyaltyTransactionsByUser(ctx, userID)
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Failed to count loyalty history."), err)
	}
	rows, err := s.db.Queries.ListLoyaltyTransactionsByUser(ctx, sqlcdb.ListLoyaltyTransactionsByUserParams{
		UserID: userID,
		Limit:  int32(limit),
		Offset: int32((page - 1) * limit),
	})
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Failed to list loyalty history."), err)
	}
	return mapTransactions(rows), total, nil
}

func (s *Service) ListCustomerRewards(ctx context.Context) ([]RewardDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	rows, err := s.db.Queries.ListActiveLoyaltyRewards(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to list rewards."), err)
	}
	return mapRewards(rows)
}

func (s *Service) ListPublicRewards(ctx context.Context) ([]RewardDTO, error) {
	return s.ListCustomerRewards(ctx)
}

func (s *Service) Redeem(ctx context.Context, userID, rewardID uuid.UUID) (*RedemptionDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to start redemption transaction."), err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	qtx := s.db.Queries.WithTx(tx)

	account, err := qtx.GetLoyaltyAccountForUpdate(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			created, createErr := qtx.CreateLoyaltyAccount(ctx, sqlcdb.CreateLoyaltyAccountParams{
				ID:     uuid.New(),
				UserID: userID,
			})
			if createErr != nil {
				return nil, apperr.Wrap(apperr.Internal("Failed to create loyalty account."), createErr)
			}
			account, err = qtx.GetLoyaltyAccountForUpdate(ctx, userID)
			if err != nil {
				return nil, apperr.Wrap(apperr.Internal("Failed to lock loyalty account."), err)
			}
			_ = created
		} else {
			return nil, apperr.Wrap(apperr.Internal("Failed to load loyalty account."), err)
		}
	}

	reward, err := qtx.GetLoyaltyRewardForUpdate(ctx, rewardID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Reward not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load reward."), err)
	}
	if !reward.IsActive {
		return nil, apperr.BadRequest("Reward is not available.")
	}
	if reward.Stock.Valid && reward.Stock.Int32 <= 0 {
		return nil, apperr.Conflict("Reward is out of stock.")
	}
	if account.Balance < reward.PointsCost {
		return nil, apperr.Conflict("Insufficient loyalty points.")
	}

	if reward.Stock.Valid {
		if _, err := qtx.DecrementLoyaltyRewardStock(ctx, reward.ID); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, apperr.Conflict("Reward is out of stock.")
			}
			return nil, apperr.Wrap(apperr.Internal("Failed to reserve reward stock."), err)
		}
	}

	newBalance := account.Balance - reward.PointsCost
	newRedeemed := account.LifetimeRedeemed + reward.PointsCost
	updatedAccount, err := qtx.UpdateLoyaltyAccountBalances(ctx, sqlcdb.UpdateLoyaltyAccountBalancesParams{
		ID:               account.ID,
		Balance:          newBalance,
		LifetimeEarned:   account.LifetimeEarned,
		LifetimeRedeemed: newRedeemed,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to update loyalty balance."), err)
	}

	txnID := uuid.New()
	relatedType := "loyalty_reward"
	txn, err := qtx.CreateLoyaltyTransaction(ctx, sqlcdb.CreateLoyaltyTransactionParams{
		ID:                txnID,
		AccountID:         account.ID,
		UserID:            userID,
		Type:              "redeem",
		Points:            -reward.PointsCost,
		BalanceAfter:      newBalance,
		Source:            "reward_redemption",
		Description:       fmt.Sprintf("Redeemed %s", reward.Title),
		RelatedEntityType: &relatedType,
		RelatedEntityID:   &reward.ID,
		CampaignID:        nil,
		ActorUserID:       &userID,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to record redemption transaction."), err)
	}

	redemption, err := qtx.CreateLoyaltyRedemption(ctx, sqlcdb.CreateLoyaltyRedemptionParams{
		ID:            uuid.New(),
		UserID:        userID,
		AccountID:     account.ID,
		RewardID:      reward.ID,
		TransactionID: txn.ID,
		PointsSpent:   reward.PointsCost,
		Status:        "completed",
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to create redemption record."), err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to commit redemption."), err)
	}

	_ = s.writeAudit(ctx, &userID, "loyalty.redeemed", redemption.ID.String(), map[string]any{
		"rewardId": reward.ID.String(),
		"points":   reward.PointsCost,
	})

	rewardDTO, err := toRewardDTO(reward)
	if err != nil {
		return nil, err
	}
	return &RedemptionDTO{
		ID:          redemption.ID.String(),
		RewardID:    reward.ID.String(),
		PointsSpent: redemption.PointsSpent,
		Status:      redemption.Status,
		CreatedAt:   redemption.CreatedAt.UTC().Format(time.RFC3339),
		Account:     toAccountDTO(updatedAccount),
		Reward:      rewardDTO,
	}, nil
}

func (s *Service) EarnForReservationCompleted(ctx context.Context, userID, reservationID uuid.UUID) (*AccountDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	settings, err := s.db.Queries.GetLoyaltySettings(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load loyalty settings."), err)
	}
	if settings.PointsPerCompletedReservation <= 0 {
		account, ensureErr := s.ensureAccount(ctx, userID)
		if ensureErr != nil {
			return nil, ensureErr
		}
		dto := toAccountDTO(*account)
		return &dto, nil
	}

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to start earn transaction."), err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	qtx := s.db.Queries.WithTx(tx)

	account, err := ensureAccountTx(ctx, qtx, userID)
	if err != nil {
		return nil, err
	}
	account, err = qtx.GetLoyaltyAccountForUpdate(ctx, userID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to lock loyalty account."), err)
	}

	membershipMultiplier := 1.0
	levelCode := ""
	membership, memErr := qtx.GetMembershipByUserID(ctx, userID)
	if memErr == nil && membership.Status == "active" {
		level, levelErr := qtx.GetMembershipLevelByID(ctx, membership.LevelID)
		if levelErr == nil {
			levelCode = level.Code
			membershipMultiplier = membershipMultiplierFromRules(level.QualificationRules)
		}
	}

	campaignMultiplier := 1.0
	bonusPoints := int32(0)
	var campaignID *uuid.UUID
	campaigns, campErr := qtx.ListActiveLoyaltyCampaigns(ctx)
	if campErr == nil {
		for _, campaign := range campaigns {
			if !campaignEligible(campaign.EligibleLevelCodes, levelCode) {
				continue
			}
			mult, parseErr := strconv.ParseFloat(campaign.PointMultiplier, 64)
			if parseErr != nil || mult <= 0 {
				mult = 1
			}
			if mult > campaignMultiplier {
				campaignMultiplier = mult
				campaignID = &campaign.ID
			}
			if campaign.BonusPoints > bonusPoints {
				bonusPoints = campaign.BonusPoints
				campaignID = &campaign.ID
			}
		}
	}

	base := float64(settings.PointsPerCompletedReservation) * membershipMultiplier * campaignMultiplier
	earned := int32(math.Round(base))
	if earned < 1 {
		earned = 1
	}

	relatedType := "reservation"
	_, err = qtx.CreateLoyaltyTransaction(ctx, sqlcdb.CreateLoyaltyTransactionParams{
		ID:                uuid.New(),
		AccountID:         account.ID,
		UserID:            userID,
		Type:              "earn",
		Points:            earned,
		BalanceAfter:      account.Balance + earned,
		Source:            "reservation_completed",
		Description:       "Points earned for a completed reservation",
		RelatedEntityType: &relatedType,
		RelatedEntityID:   &reservationID,
		CampaignID:        campaignID,
		ActorUserID:       nil,
	})
	if err != nil {
		if isUniqueViolation(err) {
			dto := toAccountDTO(account)
			return &dto, nil
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to record earn transaction."), err)
	}

	newBalance := account.Balance + earned
	newEarned := account.LifetimeEarned + earned
	if bonusPoints > 0 {
		_, err = qtx.CreateLoyaltyTransaction(ctx, sqlcdb.CreateLoyaltyTransactionParams{
			ID:                uuid.New(),
			AccountID:         account.ID,
			UserID:            userID,
			Type:              "bonus",
			Points:            bonusPoints,
			BalanceAfter:      newBalance + bonusPoints,
			Source:            "campaign_bonus",
			Description:       "Campaign bonus points",
			RelatedEntityType: nil,
			RelatedEntityID:   nil,
			CampaignID:        campaignID,
			ActorUserID:       nil,
		})
		if err != nil {
			return nil, apperr.Wrap(apperr.Internal("Failed to record bonus transaction."), err)
		}
		newBalance += bonusPoints
		newEarned += bonusPoints
	}

	updated, err := qtx.UpdateLoyaltyAccountBalances(ctx, sqlcdb.UpdateLoyaltyAccountBalancesParams{
		ID:               account.ID,
		Balance:          newBalance,
		LifetimeEarned:   newEarned,
		LifetimeRedeemed: account.LifetimeRedeemed,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to update loyalty balances."), err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to commit loyalty earn."), err)
	}

	_ = s.writeAudit(ctx, nil, "loyalty.earned", updated.ID.String(), map[string]any{
		"points":        earned,
		"bonus":         bonusPoints,
		"reservationId": reservationID.String(),
	})

	dto := toAccountDTO(updated)
	return &dto, nil
}

func (s *Service) Adjust(ctx context.Context, input AdjustInput) (*AccountDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	if input.Points == 0 {
		return nil, apperr.Validation("Adjustment points cannot be zero.", response.FieldError{
			Field:   "points",
			Message: "must be non-zero",
		})
	}
	reason := strings.TrimSpace(input.Reason)
	if reason == "" {
		return nil, apperr.Validation("Adjustment reason is required.", response.FieldError{
			Field:   "reason",
			Message: "is required",
		})
	}

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to start adjustment transaction."), err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	qtx := s.db.Queries.WithTx(tx)

	if _, err := ensureAccountTx(ctx, qtx, input.UserID); err != nil {
		return nil, err
	}
	account, err := qtx.GetLoyaltyAccountForUpdate(ctx, input.UserID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to lock loyalty account."), err)
	}

	newBalance := account.Balance + input.Points
	if newBalance < 0 {
		return nil, apperr.Conflict("Adjustment would result in a negative balance.")
	}
	newEarned := account.LifetimeEarned
	newRedeemed := account.LifetimeRedeemed
	if input.Points > 0 {
		newEarned += input.Points
	} else {
		newRedeemed += -input.Points
	}

	updated, err := qtx.UpdateLoyaltyAccountBalances(ctx, sqlcdb.UpdateLoyaltyAccountBalancesParams{
		ID:               account.ID,
		Balance:          newBalance,
		LifetimeEarned:   newEarned,
		LifetimeRedeemed: newRedeemed,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to update loyalty balances."), err)
	}

	if _, err := qtx.CreateLoyaltyTransaction(ctx, sqlcdb.CreateLoyaltyTransactionParams{
		ID:                uuid.New(),
		AccountID:         account.ID,
		UserID:            input.UserID,
		Type:              "adjustment",
		Points:            input.Points,
		BalanceAfter:      newBalance,
		Source:            "admin_adjustment",
		Description:       reason,
		RelatedEntityType: nil,
		RelatedEntityID:   nil,
		CampaignID:        nil,
		ActorUserID:       &input.Actor,
	}); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to record adjustment."), err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to commit adjustment."), err)
	}

	_ = s.writeAudit(ctx, &input.Actor, "loyalty.adjusted", updated.ID.String(), map[string]any{
		"points": input.Points,
		"reason": reason,
	})

	dto := toAccountDTO(updated)
	return &dto, nil
}

func (s *Service) ListAdminAccounts(ctx context.Context, page, limit int) ([]AccountDTO, int64, error) {
	if err := s.requireDB(); err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	total, err := s.db.Queries.CountLoyaltyAccountsAdmin(ctx)
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Failed to count loyalty accounts."), err)
	}
	rows, err := s.db.Queries.ListLoyaltyAccountsAdmin(ctx, sqlcdb.ListLoyaltyAccountsAdminParams{
		Limit:  int32(limit),
		Offset: int32((page - 1) * limit),
	})
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Failed to list loyalty accounts."), err)
	}
	result := make([]AccountDTO, 0, len(rows))
	for _, row := range rows {
		result = append(result, AccountDTO{
			ID:               row.ID.String(),
			UserID:           row.UserID.String(),
			Balance:          row.Balance,
			LifetimeEarned:   row.LifetimeEarned,
			LifetimeRedeemed: row.LifetimeRedeemed,
			UserEmail:        row.UserEmail,
			UserFullName:     row.UserFullName,
			UpdatedAt:        row.UpdatedAt.UTC().Format(time.RFC3339),
		})
	}
	return result, total, nil
}

func (s *Service) ListAdminHistory(ctx context.Context, userID *uuid.UUID, page, limit int) ([]TransactionDTO, int64, error) {
	if err := s.requireDB(); err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	total, err := s.db.Queries.CountLoyaltyTransactionsAdmin(ctx, userID)
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Failed to count loyalty transactions."), err)
	}
	rows, err := s.db.Queries.ListLoyaltyTransactionsAdmin(ctx, sqlcdb.ListLoyaltyTransactionsAdminParams{
		Limit:  int32(limit),
		Offset: int32((page - 1) * limit),
		UserID: userID,
	})
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Failed to list loyalty transactions."), err)
	}
	result := make([]TransactionDTO, 0, len(rows))
	for _, row := range rows {
		dto := TransactionDTO{
			ID:           row.ID.String(),
			Type:         row.Type,
			Points:       row.Points,
			BalanceAfter: row.BalanceAfter,
			Source:       row.Source,
			Description:  row.Description,
			CreatedAt:    row.CreatedAt.UTC().Format(time.RFC3339),
			UserEmail:    row.UserEmail,
			UserFullName: row.UserFullName,
		}
		if row.RelatedEntityType != nil {
			dto.RelatedEntityType = row.RelatedEntityType
		}
		if row.RelatedEntityID != nil {
			id := row.RelatedEntityID.String()
			dto.RelatedEntityID = &id
		}
		result = append(result, dto)
	}
	return result, total, nil
}

func (s *Service) ListCampaigns(ctx context.Context) ([]CampaignDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	rows, err := s.db.Queries.ListLoyaltyCampaignsAdmin(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to list campaigns."), err)
	}
	return mapCampaigns(rows)
}

func (s *Service) ListRewardsAdmin(ctx context.Context) ([]RewardDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	rows, err := s.db.Queries.ListLoyaltyRewardsAdmin(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to list rewards."), err)
	}
	return mapRewards(rows)
}

func (s *Service) CreateReward(ctx context.Context, actor uuid.UUID, input RewardInput) (*RewardDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	if err := validateRewardInput(input, true); err != nil {
		return nil, err
	}
	data, err := encodeRewardData(input.Data)
	if err != nil {
		return nil, err
	}
	created, err := s.db.Queries.CreateLoyaltyReward(ctx, sqlcdb.CreateLoyaltyRewardParams{
		ID:          uuid.New(),
		Code:        strings.TrimSpace(strings.ToLower(input.Code)),
		Title:       strings.TrimSpace(input.Title),
		Description: strings.TrimSpace(input.Description),
		PointsCost:  input.PointsCost,
		Stock:       toNullableInt4(input.Stock),
		IsActive:    input.IsActive,
		SortOrder:   input.SortOrder,
		Data:        data,
	})
	if err != nil {
		if isUniqueViolation(err) {
			return nil, apperr.Conflict("A reward with this code already exists.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to create reward."), err)
	}
	_ = s.writeAudit(ctx, &actor, "loyalty.reward_created", created.ID.String(), map[string]any{
		"code": created.Code,
	})
	dto, err := toRewardDTO(created)
	if err != nil {
		return nil, err
	}
	return &dto, nil
}

func (s *Service) UpdateReward(ctx context.Context, rewardID, actor uuid.UUID, input RewardInput) (*RewardDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	if err := validateRewardInput(input, false); err != nil {
		return nil, err
	}
	data, err := encodeRewardData(input.Data)
	if err != nil {
		return nil, err
	}
	updated, err := s.db.Queries.UpdateLoyaltyReward(ctx, sqlcdb.UpdateLoyaltyRewardParams{
		ID:          rewardID,
		Title:       strings.TrimSpace(input.Title),
		Description: strings.TrimSpace(input.Description),
		PointsCost:  input.PointsCost,
		Stock:       toNullableInt4(input.Stock),
		IsActive:    input.IsActive,
		SortOrder:   input.SortOrder,
		Data:        data,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Reward not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to update reward."), err)
	}
	_ = s.writeAudit(ctx, &actor, "loyalty.reward_updated", updated.ID.String(), nil)
	dto, err := toRewardDTO(updated)
	if err != nil {
		return nil, err
	}
	return &dto, nil
}

func (s *Service) DeleteReward(ctx context.Context, rewardID, actor uuid.UUID) error {
	if err := s.requireDB(); err != nil {
		return err
	}
	deleted, err := s.db.Queries.SoftDeleteLoyaltyReward(ctx, rewardID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return apperr.NotFound("Reward not found.")
		}
		return apperr.Wrap(apperr.Internal("Failed to delete reward."), err)
	}
	_ = s.writeAudit(ctx, &actor, "loyalty.reward_deleted", deleted.ID.String(), map[string]any{
		"code": deleted.Code,
	})
	return nil
}

func (s *Service) CreateCampaign(ctx context.Context, actor uuid.UUID, input CampaignInput) (*CampaignDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	if err := validateCampaignInput(input); err != nil {
		return nil, err
	}
	codes, err := json.Marshal(input.EligibleLevelCodes)
	if err != nil {
		return nil, apperr.Internal("Failed to encode eligible levels.")
	}
	created, err := s.db.Queries.CreateLoyaltyCampaign(ctx, sqlcdb.CreateLoyaltyCampaignParams{
		ID:                 uuid.New(),
		Code:               strings.TrimSpace(strings.ToLower(input.Code)),
		Name:               strings.TrimSpace(input.Name),
		Description:        strings.TrimSpace(input.Description),
		StartsAt:           input.StartsAt.UTC(),
		EndsAt:             input.EndsAt.UTC(),
		PointMultiplier:    formatMultiplier(input.PointMultiplier),
		BonusPoints:        input.BonusPoints,
		EligibleLevelCodes: codes,
		IsActive:           input.IsActive,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to create campaign."), err)
	}
	_ = s.writeAudit(ctx, &actor, "loyalty.campaign_created", created.ID.String(), map[string]any{
		"code": created.Code,
	})
	dto, err := toCampaignDTO(created)
	if err != nil {
		return nil, err
	}
	return &dto, nil
}

func (s *Service) UpdateCampaign(ctx context.Context, campaignID, actor uuid.UUID, input CampaignInput) (*CampaignDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	if err := validateCampaignInput(input); err != nil {
		return nil, err
	}
	codes, err := json.Marshal(input.EligibleLevelCodes)
	if err != nil {
		return nil, apperr.Internal("Failed to encode eligible levels.")
	}
	updated, err := s.db.Queries.UpdateLoyaltyCampaign(ctx, sqlcdb.UpdateLoyaltyCampaignParams{
		ID:                 campaignID,
		Name:               strings.TrimSpace(input.Name),
		Description:        strings.TrimSpace(input.Description),
		StartsAt:           input.StartsAt.UTC(),
		EndsAt:             input.EndsAt.UTC(),
		PointMultiplier:    formatMultiplier(input.PointMultiplier),
		BonusPoints:        input.BonusPoints,
		EligibleLevelCodes: codes,
		IsActive:           input.IsActive,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Campaign not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to update campaign."), err)
	}
	_ = s.writeAudit(ctx, &actor, "loyalty.campaign_updated", updated.ID.String(), nil)
	dto, err := toCampaignDTO(updated)
	if err != nil {
		return nil, err
	}
	return &dto, nil
}

func (s *Service) ensureAccount(ctx context.Context, userID uuid.UUID) (*sqlcdb.LoyaltyAccount, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	existing, err := s.db.Queries.GetLoyaltyAccountByUserID(ctx, userID)
	if err == nil {
		return &existing, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, apperr.Wrap(apperr.Internal("Failed to load loyalty account."), err)
	}
	created, err := s.db.Queries.CreateLoyaltyAccount(ctx, sqlcdb.CreateLoyaltyAccountParams{
		ID:     uuid.New(),
		UserID: userID,
	})
	if err != nil {
		existing, retryErr := s.db.Queries.GetLoyaltyAccountByUserID(ctx, userID)
		if retryErr == nil {
			return &existing, nil
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to create loyalty account."), err)
	}
	return &created, nil
}

func ensureAccountTx(ctx context.Context, q *sqlcdb.Queries, userID uuid.UUID) (sqlcdb.LoyaltyAccount, error) {
	existing, err := q.GetLoyaltyAccountByUserID(ctx, userID)
	if err == nil {
		return existing, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return sqlcdb.LoyaltyAccount{}, apperr.Wrap(apperr.Internal("Failed to load loyalty account."), err)
	}
	created, err := q.CreateLoyaltyAccount(ctx, sqlcdb.CreateLoyaltyAccountParams{
		ID:     uuid.New(),
		UserID: userID,
	})
	if err != nil {
		existing, retryErr := q.GetLoyaltyAccountByUserID(ctx, userID)
		if retryErr == nil {
			return existing, nil
		}
		return sqlcdb.LoyaltyAccount{}, apperr.Wrap(apperr.Internal("Failed to create loyalty account."), err)
	}
	return created, nil
}

func membershipMultiplierFromRules(raw []byte) float64 {
	var rules struct {
		LoyaltyPointMultiplier float64 `json:"loyaltyPointMultiplier"`
	}
	if err := json.Unmarshal(raw, &rules); err != nil || rules.LoyaltyPointMultiplier <= 0 {
		return 1
	}
	return rules.LoyaltyPointMultiplier
}

func campaignEligible(raw []byte, levelCode string) bool {
	var codes []string
	if err := json.Unmarshal(raw, &codes); err != nil {
		return true
	}
	if len(codes) == 0 {
		return true
	}
	if levelCode == "" {
		return false
	}
	for _, code := range codes {
		if strings.EqualFold(code, levelCode) {
			return true
		}
	}
	return false
}

func validateCampaignInput(input CampaignInput) error {
	if strings.TrimSpace(input.Code) == "" {
		return apperr.Validation("Campaign code is required.", response.FieldError{Field: "code", Message: "is required"})
	}
	if strings.TrimSpace(input.Name) == "" {
		return apperr.Validation("Campaign name is required.", response.FieldError{Field: "name", Message: "is required"})
	}
	if !input.EndsAt.After(input.StartsAt) {
		return apperr.Validation("Campaign end must be after start.", response.FieldError{Field: "endsAt", Message: "must be after startsAt"})
	}
	if input.PointMultiplier <= 0 {
		return apperr.Validation("Point multiplier must be positive.", response.FieldError{Field: "pointMultiplier", Message: "must be > 0"})
	}
	if input.BonusPoints < 0 {
		return apperr.Validation("Bonus points cannot be negative.", response.FieldError{Field: "bonusPoints", Message: "must be >= 0"})
	}
	return nil
}

func formatMultiplier(value float64) string {
	return strconv.FormatFloat(value, 'f', 2, 64)
}

func toAccountDTO(account sqlcdb.LoyaltyAccount) AccountDTO {
	return AccountDTO{
		ID:               account.ID.String(),
		UserID:           account.UserID.String(),
		Balance:          account.Balance,
		LifetimeEarned:   account.LifetimeEarned,
		LifetimeRedeemed: account.LifetimeRedeemed,
		UpdatedAt:        account.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func mapTransactions(rows []sqlcdb.LoyaltyTransaction) []TransactionDTO {
	result := make([]TransactionDTO, 0, len(rows))
	for _, row := range rows {
		dto := TransactionDTO{
			ID:           row.ID.String(),
			Type:         row.Type,
			Points:       row.Points,
			BalanceAfter: row.BalanceAfter,
			Source:       row.Source,
			Description:  row.Description,
			CreatedAt:    row.CreatedAt.UTC().Format(time.RFC3339),
		}
		if row.RelatedEntityType != nil {
			dto.RelatedEntityType = row.RelatedEntityType
		}
		if row.RelatedEntityID != nil {
			id := row.RelatedEntityID.String()
			dto.RelatedEntityID = &id
		}
		result = append(result, dto)
	}
	return result
}

func mapRewards(rows []sqlcdb.LoyaltyReward) ([]RewardDTO, error) {
	result := make([]RewardDTO, 0, len(rows))
	for _, row := range rows {
		dto, err := toRewardDTO(row)
		if err != nil {
			return nil, err
		}
		result = append(result, dto)
	}
	return result, nil
}

func toRewardDTO(row sqlcdb.LoyaltyReward) (RewardDTO, error) {
	data := map[string]any{}
	if len(row.Data) > 0 {
		if err := json.Unmarshal(row.Data, &data); err != nil {
			return RewardDTO{}, apperr.Internal("Invalid reward configuration.")
		}
	}
	dto := RewardDTO{
		ID:          row.ID.String(),
		Code:        row.Code,
		Title:       row.Title,
		Description: row.Description,
		PointsCost:  row.PointsCost,
		IsActive:    row.IsActive,
		SortOrder:   row.SortOrder,
		Data:        data,
	}
	if row.Stock.Valid {
		stock := row.Stock.Int32
		dto.Stock = &stock
	}
	return dto, nil
}

func validateRewardInput(input RewardInput, requireCode bool) error {
	var fieldErrors []response.FieldError
	if requireCode && strings.TrimSpace(input.Code) == "" {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "code", Message: "is required"})
	}
	if strings.TrimSpace(input.Title) == "" {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "title", Message: "is required"})
	}
	if input.PointsCost <= 0 {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "pointsCost", Message: "must be greater than 0"})
	}
	if input.Stock != nil && *input.Stock < 0 {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "stock", Message: "must be greater than or equal to 0"})
	}
	if len(fieldErrors) > 0 {
		return apperr.Validation("Invalid reward payload.", fieldErrors...)
	}
	return nil
}

func encodeRewardData(data map[string]any) ([]byte, error) {
	if data == nil {
		data = map[string]any{}
	}
	encoded, err := json.Marshal(data)
	if err != nil {
		return nil, apperr.Internal("Failed to encode reward data.")
	}
	return encoded, nil
}

func toNullableInt4(value *int32) pgtype.Int4 {
	if value == nil {
		return pgtype.Int4{}
	}
	return pgtype.Int4{Int32: *value, Valid: true}
}

func mapCampaigns(rows []sqlcdb.LoyaltyCampaign) ([]CampaignDTO, error) {
	result := make([]CampaignDTO, 0, len(rows))
	for _, row := range rows {
		dto, err := toCampaignDTO(row)
		if err != nil {
			return nil, err
		}
		result = append(result, dto)
	}
	return result, nil
}

func toCampaignDTO(row sqlcdb.LoyaltyCampaign) (CampaignDTO, error) {
	mult, err := strconv.ParseFloat(row.PointMultiplier, 64)
	if err != nil {
		mult = 1
	}
	var codes []string
	if len(row.EligibleLevelCodes) > 0 {
		_ = json.Unmarshal(row.EligibleLevelCodes, &codes)
	}
	if codes == nil {
		codes = []string{}
	}
	return CampaignDTO{
		ID:                 row.ID.String(),
		Code:               row.Code,
		Name:               row.Name,
		Description:        row.Description,
		StartsAt:           row.StartsAt.UTC().Format(time.RFC3339),
		EndsAt:             row.EndsAt.UTC().Format(time.RFC3339),
		PointMultiplier:    mult,
		BonusPoints:        row.BonusPoints,
		EligibleLevelCodes: codes,
		IsActive:           row.IsActive,
	}, nil
}

func isUniqueViolation(err error) bool {
	return err != nil && strings.Contains(err.Error(), "duplicate key")
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
		ResourceType: "loyalty",
		ResourceID:   resourceIDPtr,
		IpAddress:    "",
		UserAgent:    "",
		Metadata:     metadata,
	})
}
