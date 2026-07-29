package password

import (
	"fmt"
	"unicode"

	"github.com/alexedwards/argon2id"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
)

const minPasswordLength = 8

func Hash(plain string) (string, error) {
	hash, err := argon2id.CreateHash(plain, argon2id.DefaultParams)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}

	return hash, nil
}

func Compare(plain, hash string) (bool, error) {
	match, err := argon2id.ComparePasswordAndHash(plain, hash)
	if err != nil {
		return false, fmt.Errorf("compare password: %w", err)
	}

	return match, nil
}

func Validate(plain string) error {
	if len(plain) < minPasswordLength {
		return apperr.Validation(
			"Password does not meet policy requirements.",
			response.FieldError{
				Field:   "password",
				Message: fmt.Sprintf("must be at least %d characters", minPasswordLength),
			},
		)
	}

	var hasLetter, hasNumber bool
	for _, r := range plain {
		switch {
		case unicode.IsLetter(r):
			hasLetter = true
		case unicode.IsNumber(r):
			hasNumber = true
		}
	}

	if !hasLetter || !hasNumber {
		return apperr.Validation(
			"Password does not meet policy requirements.",
			response.FieldError{
				Field:   "password",
				Message: "must include at least one letter and one number",
			},
		)
	}

	return nil
}
