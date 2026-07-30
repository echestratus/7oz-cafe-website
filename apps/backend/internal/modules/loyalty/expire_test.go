package loyalty

import (
	"testing"
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database/sqlcdb"
	"github.com/google/uuid"
)

func TestPointsEligibleToExpireFIFO(t *testing.T) {
	accountID := uuid.New()
	userID := uuid.New()
	day := func(offset int) time.Time {
		return time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC).AddDate(0, 0, offset)
	}

	txs := []sqlcdb.LoyaltyTransaction{
		{ID: uuid.New(), AccountID: accountID, UserID: userID, Type: "earn", Points: 100, CreatedAt: day(0)},
		{ID: uuid.New(), AccountID: accountID, UserID: userID, Type: "earn", Points: 50, CreatedAt: day(40)},
		{ID: uuid.New(), AccountID: accountID, UserID: userID, Type: "redeem", Points: -30, CreatedAt: day(41)},
	}

	cutoff := day(30)
	got := pointsEligibleToExpire(txs, cutoff, 120)
	// Oldest lot 100, redeem consumes 30 → 70 remaining older than cutoff.
	if got != 70 {
		t.Fatalf("expected 70 eligible points, got %d", got)
	}
}

func TestPointsEligibleToExpireNeverExceedsBalance(t *testing.T) {
	accountID := uuid.New()
	userID := uuid.New()
	old := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	txs := []sqlcdb.LoyaltyTransaction{
		{ID: uuid.New(), AccountID: accountID, UserID: userID, Type: "earn", Points: 200, CreatedAt: old},
	}
	got := pointsEligibleToExpire(txs, time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), 50)
	if got != 50 {
		t.Fatalf("expected balance cap 50, got %d", got)
	}
}

func TestPointsEligibleToExpireNoOldLots(t *testing.T) {
	accountID := uuid.New()
	userID := uuid.New()
	recent := time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC)
	txs := []sqlcdb.LoyaltyTransaction{
		{ID: uuid.New(), AccountID: accountID, UserID: userID, Type: "earn", Points: 80, CreatedAt: recent},
	}
	cutoff := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	got := pointsEligibleToExpire(txs, cutoff, 80)
	if got != 0 {
		t.Fatalf("expected 0 eligible points, got %d", got)
	}
}
