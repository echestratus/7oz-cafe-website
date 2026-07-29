package database

import (
	"context"
	"fmt"
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Postgres struct {
	Pool *pgxpool.Pool
}

func NewPostgres(ctx context.Context, cfg config.DatabaseConfig, dsn string) (*Postgres, error) {
	poolConfig, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("parse database config: %w", err)
	}

	poolConfig.MaxConns = 10
	poolConfig.MinConns = 1
	poolConfig.MaxConnLifetime = 30 * time.Minute
	poolConfig.HealthCheckPeriod = 30 * time.Second

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("create database pool: %w", err)
	}

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database (%s:%d/%s): %w", cfg.Host, cfg.Port, cfg.Name, err)
	}

	return &Postgres{Pool: pool}, nil
}

func (p *Postgres) Close() {
	if p == nil || p.Pool == nil {
		return
	}

	p.Pool.Close()
}

func (p *Postgres) Ping(ctx context.Context) error {
	if p == nil || p.Pool == nil {
		return fmt.Errorf("database is not initialized")
	}

	return p.Pool.Ping(ctx)
}
