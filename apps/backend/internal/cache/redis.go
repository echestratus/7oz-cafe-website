package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/config"
	"github.com/redis/go-redis/v9"
)

type Redis struct {
	Client *redis.Client
}

func NewRedis(ctx context.Context, cfg config.RedisConfig) (*Redis, error) {
	client := redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password:     cfg.Password,
		DB:           0,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := client.Ping(pingCtx).Err(); err != nil {
		_ = client.Close()
		return nil, fmt.Errorf("ping redis (%s:%d): %w", cfg.Host, cfg.Port, err)
	}

	return &Redis{Client: client}, nil
}

func (r *Redis) Close() error {
	if r == nil || r.Client == nil {
		return nil
	}

	return r.Client.Close()
}

func (r *Redis) Ping(ctx context.Context) error {
	if r == nil || r.Client == nil {
		return fmt.Errorf("redis is not initialized")
	}

	return r.Client.Ping(ctx).Err()
}
