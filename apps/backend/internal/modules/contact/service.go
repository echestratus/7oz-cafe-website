package contact

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database/sqlcdb"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/mailer"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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

type MessageDTO struct {
	ID        string `json:"id"`
	FullName  string `json:"fullName"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	Message   string `json:"message"`
	Status    string `json:"status"`
	IPAddress string `json:"ipAddress"`
	UserAgent string `json:"userAgent"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
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

func (s *Service) ListAdmin(ctx context.Context, status, search string, page, limit int) ([]MessageDTO, int64, error) {
	if s.db == nil {
		return nil, 0, apperr.Internal("Database is unavailable.")
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var statusPtr *string
	if trimmed := strings.TrimSpace(status); trimmed != "" {
		if err := validateStatus(trimmed); err != nil {
			return nil, 0, err
		}
		statusPtr = &trimmed
	}
	var searchPtr *string
	if trimmed := strings.TrimSpace(search); trimmed != "" {
		searchPtr = &trimmed
	}

	total, err := s.db.Queries.CountContactMessagesAdmin(ctx, sqlcdb.CountContactMessagesAdminParams{
		Status: statusPtr,
		Search: searchPtr,
	})
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Failed to count contact messages."), err)
	}

	rows, err := s.db.Queries.ListContactMessagesAdmin(ctx, sqlcdb.ListContactMessagesAdminParams{
		Limit:  int32(limit),
		Offset: int32((page - 1) * limit),
		Status: statusPtr,
		Search: searchPtr,
	})
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Failed to list contact messages."), err)
	}

	items := make([]MessageDTO, 0, len(rows))
	for _, row := range rows {
		items = append(items, toMessageDTO(row))
	}
	return items, total, nil
}

func (s *Service) GetAdmin(ctx context.Context, id uuid.UUID) (*MessageDTO, error) {
	if s.db == nil {
		return nil, apperr.Internal("Database is unavailable.")
	}

	row, err := s.db.Queries.GetContactMessageByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Contact message not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load contact message."), err)
	}
	dto := toMessageDTO(row)
	return &dto, nil
}

func (s *Service) UpdateStatus(ctx context.Context, id uuid.UUID, status string) (*MessageDTO, error) {
	if s.db == nil {
		return nil, apperr.Internal("Database is unavailable.")
	}

	status = strings.TrimSpace(strings.ToLower(status))
	if err := validateStatus(status); err != nil {
		return nil, err
	}

	if _, err := s.GetAdmin(ctx, id); err != nil {
		return nil, err
	}

	updated, err := s.db.Queries.UpdateContactMessageStatus(ctx, sqlcdb.UpdateContactMessageStatusParams{
		ID:     id,
		Status: status,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to update contact message status."), err)
	}
	dto := toMessageDTO(updated)
	return &dto, nil
}

func validateStatus(status string) error {
	switch status {
	case "new", "read", "archived":
		return nil
	default:
		return apperr.Validation("Invalid status.", response.FieldError{
			Field:   "status",
			Message: "must be new, read, or archived",
		})
	}
}

func toMessageDTO(row sqlcdb.ContactMessage) MessageDTO {
	return MessageDTO{
		ID:        row.ID.String(),
		FullName:  row.FullName,
		Email:     row.Email,
		Phone:     row.Phone,
		Message:   row.Message,
		Status:    row.Status,
		IPAddress: row.IpAddress,
		UserAgent: row.UserAgent,
		CreatedAt: row.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: row.UpdatedAt.UTC().Format(time.RFC3339),
	}
}
