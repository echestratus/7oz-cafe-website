package response

type Success[T any] struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    T      `json:"data"`
}

type ErrorBody struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
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

func Fail(message string, errors ...FieldError) ErrorBody {
	return ErrorBody{
		Success: false,
		Message: message,
		Errors:  errors,
	}
}
