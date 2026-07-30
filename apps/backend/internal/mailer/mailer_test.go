package mailer_test

import (
	"context"
	"testing"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/config"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/mailer"
	"go.uber.org/zap"
)

func TestNewFromConfigUsesLogSenderWithoutSMTPInDevelopment(t *testing.T) {
	cfg := &config.Config{
		Env:        "development",
		WebsiteURL: "http://localhost:3000",
		SMTP: config.SMTPConfig{
			FromEmail: "noreply@7oz.local",
			FromName:  "7Oz",
		},
	}

	notifier, err := mailer.NewFromConfig(cfg, zap.NewNop())
	if err != nil {
		t.Fatalf("expected notifier, got error: %v", err)
	}

	if err := notifier.SendVerification(context.Background(), "guest@example.com", "Guest", "token-123"); err != nil {
		t.Fatalf("expected log sender to succeed, got: %v", err)
	}
}

func TestNewFromConfigRequiresSMTPOutsideDevelopment(t *testing.T) {
	cfg := &config.Config{
		Env: "production",
		SMTP: config.SMTPConfig{
			FromEmail: "noreply@7oz.local",
		},
	}

	_, err := mailer.NewFromConfig(cfg, zap.NewNop())
	if err == nil {
		t.Fatal("expected missing SMTP_HOST to fail in production")
	}
}
