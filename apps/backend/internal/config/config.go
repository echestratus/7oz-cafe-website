package config

import (
	"fmt"
	"strings"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Env                string
	Name               string
	Port               int
	URL                string
	CORSAllowedOrigins []string
	Database           DatabaseConfig
	Redis              RedisConfig
	JWT                JWTConfig
	Storage            StorageConfig
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Name     string
	SSLMode  string
}

type RedisConfig struct {
	Host     string
	Port     int
	Password string
}

type JWTConfig struct {
	AccessSecret  string
	RefreshSecret string
	AccessTTL     time.Duration
	RefreshTTL    time.Duration
}

type StorageConfig struct {
	Driver    string
	LocalPath string
}

func Load() (*Config, error) {
	v := viper.New()

	setDefaults(v)
	v.AutomaticEnv()
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	bindEnv(v)

	accessTTL, err := time.ParseDuration(v.GetString("JWT_ACCESS_TTL"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_ACCESS_TTL: %w", err)
	}

	refreshTTL, err := time.ParseDuration(v.GetString("JWT_REFRESH_TTL"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_REFRESH_TTL: %w", err)
	}

	cfg := &Config{
		Env:                v.GetString("APP_ENV"),
		Name:               v.GetString("APP_NAME"),
		Port:               v.GetInt("APP_PORT"),
		URL:                v.GetString("APP_URL"),
		CORSAllowedOrigins: splitAndTrim(v.GetString("CORS_ALLOWED_ORIGINS")),
		Database: DatabaseConfig{
			Host:     v.GetString("DB_HOST"),
			Port:     v.GetInt("DB_PORT"),
			User:     v.GetString("DB_USER"),
			Password: v.GetString("DB_PASSWORD"),
			Name:     v.GetString("DB_NAME"),
			SSLMode:  v.GetString("DB_SSLMODE"),
		},
		Redis: RedisConfig{
			Host:     v.GetString("REDIS_HOST"),
			Port:     v.GetInt("REDIS_PORT"),
			Password: v.GetString("REDIS_PASSWORD"),
		},
		JWT: JWTConfig{
			AccessSecret:  v.GetString("JWT_ACCESS_SECRET"),
			RefreshSecret: v.GetString("JWT_REFRESH_SECRET"),
			AccessTTL:     accessTTL,
			RefreshTTL:    refreshTTL,
		},
		Storage: StorageConfig{
			Driver:    v.GetString("STORAGE_DRIVER"),
			LocalPath: v.GetString("STORAGE_LOCAL_PATH"),
		},
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

func setDefaults(v *viper.Viper) {
	v.SetDefault("APP_ENV", "development")
	v.SetDefault("APP_NAME", "7oz-cafe")
	v.SetDefault("APP_PORT", 8080)
	v.SetDefault("APP_URL", "http://localhost:8080")
	v.SetDefault("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001")

	v.SetDefault("DB_HOST", "localhost")
	v.SetDefault("DB_PORT", 5432)
	v.SetDefault("DB_USER", "sevenoz")
	v.SetDefault("DB_PASSWORD", "sevenoz_dev_password")
	v.SetDefault("DB_NAME", "sevenoz")
	v.SetDefault("DB_SSLMODE", "disable")

	v.SetDefault("REDIS_HOST", "localhost")
	v.SetDefault("REDIS_PORT", 6379)
	v.SetDefault("REDIS_PASSWORD", "")

	v.SetDefault("JWT_ACCESS_SECRET", "dev-access-secret-change-me-min-32-chars")
	v.SetDefault("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me-min-32-chars")
	v.SetDefault("JWT_ACCESS_TTL", "15m")
	v.SetDefault("JWT_REFRESH_TTL", "720h")

	v.SetDefault("STORAGE_DRIVER", "local")
	v.SetDefault("STORAGE_LOCAL_PATH", "./storage")
}

func bindEnv(v *viper.Viper) {
	keys := []string{
		"APP_ENV", "APP_NAME", "APP_PORT", "APP_URL", "CORS_ALLOWED_ORIGINS",
		"DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_SSLMODE",
		"REDIS_HOST", "REDIS_PORT", "REDIS_PASSWORD",
		"JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "JWT_ACCESS_TTL", "JWT_REFRESH_TTL",
		"STORAGE_DRIVER", "STORAGE_LOCAL_PATH",
	}

	for _, key := range keys {
		_ = v.BindEnv(key)
	}
}

func (c *Config) validate() error {
	if c.Port <= 0 {
		return fmt.Errorf("APP_PORT must be a positive integer")
	}

	if c.Name == "" {
		return fmt.Errorf("APP_NAME is required")
	}

	if len(c.JWT.AccessSecret) < 32 {
		return fmt.Errorf("JWT_ACCESS_SECRET must be at least 32 characters")
	}

	if len(c.JWT.RefreshSecret) < 32 {
		return fmt.Errorf("JWT_REFRESH_SECRET must be at least 32 characters")
	}

	if c.Database.Host == "" || c.Database.Name == "" || c.Database.User == "" {
		return fmt.Errorf("database configuration is incomplete")
	}

	if c.Redis.Host == "" || c.Redis.Port <= 0 {
		return fmt.Errorf("redis configuration is incomplete")
	}

	return nil
}

func (c *Config) DatabaseDSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=%s",
		c.Database.User,
		c.Database.Password,
		c.Database.Host,
		c.Database.Port,
		c.Database.Name,
		c.Database.SSLMode,
	)
}

func (c *Config) RedisAddr() string {
	return fmt.Sprintf("%s:%d", c.Redis.Host, c.Redis.Port)
}

func (c *Config) IsDevelopment() bool {
	return c.Env == "development" || c.Env == "dev" || c.Env == "local"
}

func (c *Config) StartupTimeout() time.Duration {
	return 10 * time.Second
}

func splitAndTrim(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))

	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}

	return result
}
