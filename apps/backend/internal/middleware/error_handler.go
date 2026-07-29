package middleware

import (
	"errors"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
	"go.uber.org/zap"
)

func ErrorHandler(logger *zap.Logger) fiber.ErrorHandler {
	return func(c fiber.Ctx, err error) error {
		requestID, _ := c.Locals("request_id").(string)

		if appErr, ok := apperr.As(err); ok {
			if appErr.Status >= 500 {
				logger.Error(
					"application error",
					zap.String("request_id", requestID),
					zap.String("code", appErr.Code),
					zap.Error(appErr),
				)
			}

			return response.ErrorJSON(
				c,
				appErr.Status,
				response.FailWithCode(appErr.Code, appErr.Message, appErr.Fields...),
			)
		}

		var fiberErr *fiber.Error
		if errors.As(err, &fiberErr) {
			code := "request_error"
			if fiberErr.Code == fiber.StatusNotFound {
				code = "not_found"
			}

			return response.ErrorJSON(
				c,
				fiberErr.Code,
				response.FailWithCode(code, fiberErr.Message),
			)
		}

		logger.Error("unhandled error", zap.String("request_id", requestID), zap.Error(err))

		return response.ErrorJSON(
			c,
			fiber.StatusInternalServerError,
			response.FailWithCode("internal_error", "An unexpected error occurred."),
		)
	}
}
