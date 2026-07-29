package middleware

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"go.uber.org/zap"
)

func RequestLogger(logger *zap.Logger) fiber.Handler {
	return func(c fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		duration := time.Since(start)

		requestID, _ := c.Locals("request_id").(string)

		fields := []zap.Field{
			zap.String("request_id", requestID),
			zap.String("method", c.Method()),
			zap.String("path", c.Path()),
			zap.Int("status", c.Response().StatusCode()),
			zap.Duration("duration", duration),
			zap.String("ip", c.IP()),
		}

		if err != nil {
			logger.Error("request failed", append(fields, zap.Error(err))...)
			return err
		}

		status := c.Response().StatusCode()
		switch {
		case status >= 500:
			logger.Error("request completed", fields...)
		case status >= 400:
			logger.Warn("request completed", fields...)
		default:
			logger.Info("request completed", fields...)
		}

		return nil
	}
}
