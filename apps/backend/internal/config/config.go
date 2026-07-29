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
}

func Load() (*Config, error) {
	v := viper.New()

	v.SetDefault("APP_ENV", "development")
	v.SetDefault("APP_NAME", "7oz-cafe")
	v.SetDefault("APP_PORT", 8080)
	v.SetDefault("APP_URL", "http://localhost:8080")
	v.SetDefault("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001")

	v.AutomaticEnv()
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	_ = v.BindEnv("APP_ENV")
	_ = v.BindEnv("APP_NAME")
	_ = v.BindEnv("APP_PORT")
	_ = v.BindEnv("APP_URL")
	_ = v.BindEnv("CORS_ALLOWED_ORIGINS")

	cfg := &Config{
		Env:                v.GetString("APP_ENV"),
		Name:               v.GetString("APP_NAME"),
		Port:               v.GetInt("APP_PORT"),
		URL:                v.GetString("APP_URL"),
		CORSAllowedOrigins: splitAndTrim(v.GetString("CORS_ALLOWED_ORIGINS")),
	}

	if cfg.Port <= 0 {
		return nil, fmt.Errorf("APP_PORT must be a positive integer")
	}

	if cfg.Name == "" {
		return nil, fmt.Errorf("APP_NAME is required")
	}

	return cfg, nil
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

func (c *Config) StartupTimeout() time.Duration {
	return 10 * time.Second
}
