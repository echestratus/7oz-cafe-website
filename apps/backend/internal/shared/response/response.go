package response

import "github.com/gofiber/fiber/v3"

type Success[T any] struct {
	Success bool           `json:"success"`
	Message string         `json:"message"`
	Data    T              `json:"data"`
	Meta    map[string]any `json:"meta,omitempty"`
}

type ErrorBody struct {
	Success bool         `json:"success"`
	Message string       `json:"message"`
	Code    string       `json:"code,omitempty"`
	Errors  []FieldError `json:"errors,omitempty"`
}

type FieldError struct {
	Field   string `json:"field,omitempty"`
	Message string `json:"message"`
}

func OK[T any](message string, data T) Success[T] {
	return Success[T]{
		Success: true,
		Message: message,
		Data:    data,
	}
}

func OKWithMeta[T any](message string, data T, meta map[string]any) Success[T] {
	return Success[T]{
		Success: true,
		Message: message,
		Data:    data,
		Meta:    meta,
	}
}

func Fail(message string, errors ...FieldError) ErrorBody {
	return ErrorBody{
		Success: false,
		Message: message,
		Errors:  errors,
	}
}

func FailWithCode(code, message string, errors ...FieldError) ErrorBody {
	return ErrorBody{
		Success: false,
		Message: message,
		Code:    code,
		Errors:  errors,
	}
}

func JSON[T any](c fiber.Ctx, status int, body Success[T]) error {
	return c.Status(status).JSON(body)
}

func ErrorJSON(c fiber.Ctx, status int, body ErrorBody) error {
	return c.Status(status).JSON(body)
}
