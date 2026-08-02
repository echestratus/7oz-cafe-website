package password_test

import (
	"testing"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/security/password"
)

func TestValidateRejectsShortPassword(t *testing.T) {
	if err := password.Validate("ab1"); err == nil {
		t.Fatal("expected short password to fail")
	}
}

func TestHashAndCompare(t *testing.T) {
	hash, err := password.Hash("SecurePass1")
	if err != nil {
		t.Fatalf("hash failed: %v", err)
	}

	match, err := password.Compare("SecurePass1", hash)
	if err != nil || !match {
		t.Fatalf("expected password match, err=%v match=%v", err, match)
	}

	match, err = password.Compare("WrongPass1", hash)
	if err != nil {
		t.Fatalf("compare failed: %v", err)
	}
	if match {
		t.Fatal("expected password mismatch")
	}
}
