package token_test

import (
	"testing"
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/security/token"
	"github.com/google/uuid"
)

func TestAccessTokenRoundTrip(t *testing.T) {
	manager := token.NewAccessManager("dev-access-secret-change-me-min-32-chars", time.Minute, "7oz-test")
	userID := uuid.New()
	sessionID := uuid.NewString()

	signed, _, err := manager.Issue(userID, "user@example.com", sessionID, []string{"customer"}, []string{"menu.read"})
	if err != nil {
		t.Fatalf("issue failed: %v", err)
	}

	claims, err := manager.Parse(signed)
	if err != nil {
		t.Fatalf("parse failed: %v", err)
	}

	if claims.Subject != userID.String() {
		t.Fatalf("unexpected subject: %s", claims.Subject)
	}
	if claims.SessionID != sessionID {
		t.Fatalf("unexpected session id: %s", claims.SessionID)
	}
}

func TestRefreshTokenHashIsStable(t *testing.T) {
	raw, hash, err := token.NewRefreshToken()
	if err != nil {
		t.Fatalf("generate failed: %v", err)
	}

	if token.HashOpaqueToken(raw) != hash {
		t.Fatal("hash mismatch")
	}
}
