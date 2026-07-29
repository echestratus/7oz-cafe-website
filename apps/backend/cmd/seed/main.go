package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/alexedwards/argon2id"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/config"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database/sqlcdb"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/logger"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

const (
	defaultAdminEmail    = "admin@7oz.local"
	defaultAdminPassword = "ChangeMeNow!123"
	defaultAdminName     = "Super Admin"
	superAdminRoleCode   = "super_admin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load config: %v\n", err)
		os.Exit(1)
	}

	log, err := logger.New(cfg.Env)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to create logger: %v\n", err)
		os.Exit(1)
	}
	defer func() {
		_ = log.Sync()
	}()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	postgres, err := database.NewPostgres(ctx, cfg.Database, cfg.DatabaseDSN())
	if err != nil {
		log.Fatal("failed to connect to postgres", zap.Error(err))
	}
	defer postgres.Close()

	email := envOrDefault("SEED_ADMIN_EMAIL", defaultAdminEmail)
	password := envOrDefault("SEED_ADMIN_PASSWORD", defaultAdminPassword)
	fullName := envOrDefault("SEED_ADMIN_NAME", defaultAdminName)

	existing, err := postgres.Queries.GetUserByEmail(ctx, email)
	if err == nil {
		log.Info("admin user already exists", zap.String("email", existing.Email), zap.String("id", existing.ID.String()))
		return
	}

	role, err := postgres.Queries.GetRoleByCode(ctx, superAdminRoleCode)
	if err != nil {
		log.Fatal("failed to load super_admin role; run migrations first", zap.Error(err))
	}

	passwordHash, err := argon2id.CreateHash(password, argon2id.DefaultParams)
	if err != nil {
		log.Fatal("failed to hash admin password", zap.Error(err))
	}

	now := time.Now().UTC()
	user, err := postgres.Queries.CreateUser(ctx, sqlcdb.CreateUserParams{
		ID:              uuid.New(),
		Email:           email,
		PasswordHash:    passwordHash,
		FullName:        fullName,
		Status:          "active",
		EmailVerifiedAt: &now,
	})
	if err != nil {
		log.Fatal("failed to create admin user", zap.Error(err))
	}

	if err := postgres.Queries.AssignUserRole(ctx, sqlcdb.AssignUserRoleParams{
		UserID: user.ID,
		RoleID: role.ID,
	}); err != nil {
		log.Fatal("failed to assign super_admin role", zap.Error(err))
	}

	log.Info(
		"seeded super admin user",
		zap.String("id", user.ID.String()),
		zap.String("email", user.Email),
		zap.String("role", superAdminRoleCode),
	)
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}
