package loyalty

import (
	"context"
	"fmt"
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database/sqlcdb"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/google/uuid"
)

const (
	expirationStrategyNever         = "never"
	expirationStrategyRollingMonths = "rolling_months"
	transactionTypeExpired          = "expired"
	sourcePointsExpiration          = "points_expiration"
)

type ExpireResult struct {
	Strategy        string `json:"strategy"`
	AccountsScanned int    `json:"accountsScanned"`
	AccountsExpired int    `json:"accountsExpired"`
	PointsExpired   int32  `json:"pointsExpired"`
	Skipped         bool   `json:"skipped"`
}

type creditLot struct {
	createdAt time.Time
	remaining int32
}

// pointsEligibleToExpire reconstructs FIFO credit lots from the ledger and returns
// how many remaining points are older than cutoff, capped by currentBalance.
func pointsEligibleToExpire(txs []sqlcdb.LoyaltyTransaction, cutoff time.Time, currentBalance int32) int32 {
	if currentBalance <= 0 {
		return 0
	}

	lots := make([]creditLot, 0)
	for _, tx := range txs {
		if tx.Points > 0 {
			lots = append(lots, creditLot{createdAt: tx.CreatedAt.UTC(), remaining: tx.Points})
			continue
		}
		if tx.Points >= 0 {
			continue
		}
		debit := -tx.Points
		for i := range lots {
			if debit == 0 {
				break
			}
			if lots[i].remaining == 0 {
				continue
			}
			take := lots[i].remaining
			if take > debit {
				take = debit
			}
			lots[i].remaining -= take
			debit -= take
		}
	}

	var toExpire int32
	for _, lot := range lots {
		if lot.remaining > 0 && lot.createdAt.Before(cutoff) {
			toExpire += lot.remaining
		}
	}
	if toExpire > currentBalance {
		toExpire = currentBalance
	}
	if toExpire < 0 {
		return 0
	}
	return toExpire
}

func (s *Service) ExpirePoints(ctx context.Context, now time.Time) (*ExpireResult, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	if now.IsZero() {
		now = time.Now().UTC()
	} else {
		now = now.UTC()
	}

	settings, err := s.db.Queries.GetLoyaltySettings(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load loyalty settings."), err)
	}

	result := &ExpireResult{Strategy: settings.ExpirationStrategy}
	if settings.ExpirationStrategy != expirationStrategyRollingMonths {
		result.Skipped = true
		return result, nil
	}

	cutoff := now.AddDate(0, -int(settings.ExpirationMonths), 0)
	accounts, err := s.db.Queries.ListLoyaltyAccountsWithBalance(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to list loyalty accounts."), err)
	}

	for _, accountRow := range accounts {
		result.AccountsScanned++
		expired, err := s.expireAccount(ctx, accountRow.UserID, cutoff, now)
		if err != nil {
			return nil, err
		}
		if expired > 0 {
			result.AccountsExpired++
			result.PointsExpired += expired
		}
	}

	return result, nil
}

func (s *Service) expireAccount(ctx context.Context, userID uuid.UUID, cutoff, now time.Time) (int32, error) {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return 0, apperr.Wrap(apperr.Internal("Failed to start expiration transaction."), err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	qtx := s.db.Queries.WithTx(tx)

	account, err := qtx.GetLoyaltyAccountForUpdate(ctx, userID)
	if err != nil {
		return 0, apperr.Wrap(apperr.Internal("Failed to lock loyalty account."), err)
	}
	if account.Balance <= 0 {
		return 0, nil
	}

	txs, err := qtx.ListLoyaltyTransactionsByAccountAsc(ctx, account.ID)
	if err != nil {
		return 0, apperr.Wrap(apperr.Internal("Failed to load loyalty ledger."), err)
	}

	toExpire := pointsEligibleToExpire(txs, cutoff, account.Balance)
	if toExpire <= 0 {
		return 0, nil
	}

	newBalance := account.Balance - toExpire
	if newBalance < 0 {
		return 0, apperr.Internal("Expiration would result in a negative balance.")
	}

	updated, err := qtx.UpdateLoyaltyAccountBalances(ctx, sqlcdb.UpdateLoyaltyAccountBalancesParams{
		ID:               account.ID,
		Balance:          newBalance,
		LifetimeEarned:   account.LifetimeEarned,
		LifetimeRedeemed: account.LifetimeRedeemed,
	})
	if err != nil {
		return 0, apperr.Wrap(apperr.Internal("Failed to update loyalty balances."), err)
	}

	description := fmt.Sprintf("Expired %d points older than %s", toExpire, cutoff.Format(time.RFC3339))
	if _, err := qtx.CreateLoyaltyTransaction(ctx, sqlcdb.CreateLoyaltyTransactionParams{
		ID:                uuid.New(),
		AccountID:         account.ID,
		UserID:            userID,
		Type:              transactionTypeExpired,
		Points:            -toExpire,
		BalanceAfter:      newBalance,
		Source:            sourcePointsExpiration,
		Description:       description,
		RelatedEntityType: nil,
		RelatedEntityID:   nil,
		CampaignID:        nil,
		ActorUserID:       nil,
	}); err != nil {
		return 0, apperr.Wrap(apperr.Internal("Failed to record expiration transaction."), err)
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, apperr.Wrap(apperr.Internal("Failed to commit expiration."), err)
	}

	_ = s.writeAudit(ctx, nil, "loyalty.points_expired", updated.ID.String(), map[string]any{
		"points":  toExpire,
		"cutoff":  cutoff.Format(time.RFC3339),
		"runAt":   now.Format(time.RFC3339),
		"balance": newBalance,
	})

	return toExpire, nil
}
