package logger

import (
	"fmt"

	"go.uber.org/zap"
)

func New(env string) (*zap.Logger, error) {
	var (
		log *zap.Logger
		err error
	)

	switch env {
	case "development", "dev", "local":
		log, err = zap.NewDevelopment()
	default:
		log, err = zap.NewProduction()
	}

	if err != nil {
		return nil, fmt.Errorf("create logger: %w", err)
	}

	return log, nil
}
