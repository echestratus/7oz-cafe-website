package config_test

import (
	"os"
	"testing"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/config"
)

func TestLoadUsesDefaults(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("APP_NAME", "7oz-test")
	t.Setenv("APP_PORT", "8090")
	t.Setenv("JWT_ACCESS_SECRET", "dev-access-secret-change-me-min-32-chars")
	t.Setenv("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me-min-32-chars")

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("expected config to load, got error: %v", err)
	}

	if cfg.Name != "7oz-test" {
		t.Fatalf("expected APP_NAME 7oz-test, got %s", cfg.Name)
	}

	if cfg.Port != 8090 {
		t.Fatalf("expected APP_PORT 8090, got %d", cfg.Port)
	}

	if cfg.DatabaseDSN() == "" {
		t.Fatal("expected database DSN to be generated")
	}

	if cfg.RedisAddr() != "localhost:6379" {
		t.Fatalf("unexpected redis addr: %s", cfg.RedisAddr())
	}
}

func TestLoadRejectsShortJWTSecret(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("JWT_ACCESS_SECRET", "too-short")
	t.Setenv("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me-min-32-chars")

	_, err := config.Load()
	if err == nil {
		t.Fatal("expected invalid JWT secret to fail")
	}
}

func clearConfigEnv(t *testing.T) {
	t.Helper()

	keys := []string{
		"APP_ENV", "APP_NAME", "APP_PORT", "APP_URL", "WEBSITE_URL", "CONTACT_TO_EMAIL", "CORS_ALLOWED_ORIGINS",
		"DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_SSLMODE",
		"REDIS_HOST", "REDIS_PORT", "REDIS_PASSWORD",
		"JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "JWT_ACCESS_TTL", "JWT_REFRESH_TTL",
		"STORAGE_DRIVER", "STORAGE_LOCAL_PATH",
		"SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_FROM_EMAIL", "SMTP_FROM_NAME",
	}

	for _, key := range keys {
		_ = os.Unsetenv(key)
	}
}
