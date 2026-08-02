package apperr_test

import (
	"errors"
	"net/http"
	"testing"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
)

func TestValidationErrorIncludesFields(t *testing.T) {
	err := apperr.Validation(
		"Validation failed",
		response.FieldError{Field: "email", Message: "is required"},
	)

	if err.Status != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", err.Status)
	}

	if err.Code != "validation_error" {
		t.Fatalf("unexpected code: %s", err.Code)
	}

	if len(err.Fields) != 1 || err.Fields[0].Field != "email" {
		t.Fatalf("expected email field error, got %+v", err.Fields)
	}
}

func TestAsFindsWrappedAppError(t *testing.T) {
	root := apperr.NotFound("Reservation not found")
	wrapped := apperr.Wrap(root, errors.New("sql: no rows"))

	found, ok := apperr.As(wrapped)
	if !ok {
		t.Fatal("expected AppError")
	}

	if found.Code != "not_found" {
		t.Fatalf("unexpected code: %s", found.Code)
	}
}
