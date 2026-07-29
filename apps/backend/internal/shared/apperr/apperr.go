package apperr

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
)

type AppError struct {
	Code    string
	Message string
	Status  int
	Fields  []response.FieldError
	Cause   error
}

func (e *AppError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Cause)
	}

	return e.Message
}

func (e *AppError) Unwrap() error {
	return e.Cause
}

func New(status int, code, message string) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Status:  status,
	}
}

func WithFields(err *AppError, fields ...response.FieldError) *AppError {
	clone := *err
	clone.Fields = append([]response.FieldError{}, fields...)
	return &clone
}

func Wrap(err *AppError, cause error) *AppError {
	clone := *err
	clone.Cause = cause
	return &clone
}

func BadRequest(message string) *AppError {
	return New(http.StatusBadRequest, "bad_request", message)
}

func Unauthorized(message string) *AppError {
	return New(http.StatusUnauthorized, "unauthorized", message)
}

func Forbidden(message string) *AppError {
	return New(http.StatusForbidden, "forbidden", message)
}

func NotFound(message string) *AppError {
	return New(http.StatusNotFound, "not_found", message)
}

func Conflict(message string) *AppError {
	return New(http.StatusConflict, "conflict", message)
}

func Validation(message string, fields ...response.FieldError) *AppError {
	return WithFields(New(http.StatusUnprocessableEntity, "validation_error", message), fields...)
}

func TooManyRequests(message string) *AppError {
	return New(http.StatusTooManyRequests, "rate_limited", message)
}

func Internal(message string) *AppError {
	return New(http.StatusInternalServerError, "internal_error", message)
}

func As(err error) (*AppError, bool) {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr, true
	}

	return nil, false
}
