package contact

import (
	"context"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database/sqlcdb"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/mailer"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/google/uuid"
)

var emailPattern = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

type Service struct {
	db       *database.Postgres
	notifier *mailer.Notifier
}

type CreateInput struct {
	FullName  string
	Email     string
	Phone     string
	Message   string
	IPAddress string
	UserAgent string
}

type CreateResult struct {
	ID string `json:"id"`
}

func NewService(db *database.Postgres, notifier *mailer.Notifier) *Service {
	return &Service{db: db, notifier: notifier}
}

func (s *Service) Create(ctx context.Context, input CreateInput) (*CreateResult, error) {
	if s.db == nil {
		return nil, apperr.Internal("Database is unavailable.")
	}

	fullName := strings.TrimSpace(input.FullName)
	email := strings.TrimSpace(strings.ToLower(input.Email))
	phone := strings.TrimSpace(input.Phone)
	message := strings.TrimSpace(input.Message)

	var fieldErrors []response.FieldError
	if fullName == "" {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "fullName", Message: "is required"})
	} else if utf8.RuneCountInString(fullName) > 120 {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "fullName", Message: "must be at most 120 characters"})
	}
	if email == "" {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "email", Message: "is required"})
	} else if !emailPattern.MatchString(email) {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "email", Message: "must be a valid email"})
	}
	if utf8.RuneCountInString(phone) > 40 {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "phone", Message: "must be at most 40 characters"})
	}
	messageLen := utf8.RuneCountInString(message)
	if messageLen == 0 {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "message", Message: "is required"})
	} else if messageLen > 5000 {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "message", Message: "must be at most 5000 characters"})
	}
	if len(fieldErrors) > 0 {
		return nil, apperr.Validation("Invalid contact message.", fieldErrors...)
	}

	created, err := s.db.Queries.CreateContactMessage(ctx, sqlcdb.CreateContactMessageParams{
		ID:        uuid.New(),
		FullName:  fullName,
		Email:     email,
		Phone:     phone,
		Message:   message,
		IpAddress: strings.TrimSpace(input.IPAddress),
		UserAgent: strings.TrimSpace(input.UserAgent),
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to save contact message."), err)
	}

	if s.notifier != nil {
		// Fail soft: the message is already stored for follow-up.
		_ = s.notifier.SendContactMessage(ctx, mailer.ContactInquiry{
			FullName: fullName,
			Email:    email,
			Phone:    phone,
			Message:  message,
		})
	}

	return &CreateResult{ID: created.ID.String()}, nil
}
