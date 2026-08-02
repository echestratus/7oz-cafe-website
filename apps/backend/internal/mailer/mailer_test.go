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

func TestSendReservationConfirmedUsesLogSender(t *testing.T) {
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

	err = notifier.SendReservationConfirmed(context.Background(), mailer.ReservationConfirmation{
		GuestFullName:     "Guest",
		GuestEmail:        "guest@example.com",
		ReservationNumber: "7OZ-20260802-ABCD",
		Date:              "2026-08-10",
		Time:              "18:00",
		GuestCount:        2,
		Status:            "confirmed",
	})
	if err != nil {
		t.Fatalf("expected confirmed reservation email to succeed, got: %v", err)
	}
}

func TestSendReservationCancelledUsesLogSender(t *testing.T) {
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

	err = notifier.SendReservationCancelled(context.Background(), mailer.ReservationConfirmation{
		GuestFullName:     "Guest",
		GuestEmail:        "guest@example.com",
		ReservationNumber: "7OZ-20260802-ABCD",
		Date:              "2026-08-10",
		Time:              "18:00",
		GuestCount:        2,
		Status:            "cancelled",
	})
	if err != nil {
		t.Fatalf("expected cancelled reservation email to succeed, got: %v", err)
	}
}
