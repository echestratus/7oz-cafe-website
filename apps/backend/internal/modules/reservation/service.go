package reservation

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/database/sqlcdb"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/mailer"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var (
	emailPattern = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
	phonePattern = regexp.MustCompile(`^[0-9+\-\s()]{8,20}$`)
)

type Service struct {
	db          *database.Postgres
	notifier    *mailer.Notifier
	onCompleted func(ctx context.Context, userID uuid.UUID, reservationID uuid.UUID)
}

func (s *Service) SetOnCompleted(fn func(ctx context.Context, userID uuid.UUID, reservationID uuid.UUID)) {
	s.onCompleted = fn
}

type CreateInput struct {
	FullName       string
	Email          string
	Phone          string
	Date           string
	Time           string
	GuestCount     int
	Notes          string
	CustomerUserID *uuid.UUID
}

// AdminCreateInput is used by staff walk-in / phone bookings.
type AdminCreateInput struct {
	FullName    string
	Email       string
	Phone       string
	Date        string
	Time        string
	GuestCount  int
	Notes       string
	TableID     *uuid.UUID
	Status      string // pending | confirmed; empty defaults to confirmed
	NotifyGuest *bool  // nil defaults to true
	ActorUserID uuid.UUID
}

type preparedCreate struct {
	fullName   string
	email      string
	phone      string
	notes      string
	date       time.Time
	clock      time.Time
	guestCount int32
}

type ReservationDTO struct {
	ID                string  `json:"id"`
	ReservationNumber string  `json:"reservationNumber"`
	GuestFullName     string  `json:"guestFullName"`
	GuestEmail        string  `json:"guestEmail"`
	GuestPhone        string  `json:"guestPhone"`
	Date              string  `json:"date"`
	Time              string  `json:"time"`
	GuestCount        int32   `json:"guestCount"`
	Status            string  `json:"status"`
	Notes             string  `json:"notes"`
	TableID           *string `json:"tableId,omitempty"`
	CreatedAt         string  `json:"createdAt"`
}

type AvailabilitySlot struct {
	Time              string `json:"time"`
	Available         bool   `json:"available"`
	RemainingCapacity int32  `json:"remainingCapacity"`
}

type CafeTableDTO struct {
	ID        string `json:"id"`
	Code      string `json:"code"`
	Name      string `json:"name"`
	Capacity  int32  `json:"capacity"`
	IsActive  bool   `json:"isActive"`
	SortOrder int32  `json:"sortOrder"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

type CafeTableInput struct {
	Code      string
	Name      string
	Capacity  int32
	IsActive  bool
	SortOrder int32
}

type SettingsDTO struct {
	ID                  string              `json:"id"`
	MinGuests           int32               `json:"minGuests"`
	MaxGuests           int32               `json:"maxGuests"`
	MinAdvanceMinutes   int32               `json:"minAdvanceMinutes"`
	MaxAdvanceDays      int32               `json:"maxAdvanceDays"`
	SlotIntervalMinutes int32               `json:"slotIntervalMinutes"`
	DurationMinutes     int32               `json:"durationMinutes"`
	BufferMinutes       int32               `json:"bufferMinutes"`
	CancelCutoffMinutes int32               `json:"cancelCutoffMinutes"`
	Timezone            string              `json:"timezone"`
	WeeklyHours         map[string]dayHours `json:"weeklyHours"`
	UpdatedAt           string              `json:"updatedAt"`
}

type SettingsInput struct {
	MinGuests           int32
	MaxGuests           int32
	MinAdvanceMinutes   int32
	MaxAdvanceDays      int32
	SlotIntervalMinutes int32
	DurationMinutes     int32
	BufferMinutes       int32
	CancelCutoffMinutes int32
	Timezone            string
	WeeklyHours         map[string]dayHours
}

type dayHours struct {
	Open  string `json:"open"`
	Close string `json:"close"`
}

var weekdayKeys = []string{
	"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
}

func NewService(db *database.Postgres, notifier *mailer.Notifier) *Service {
	return &Service{db: db, notifier: notifier}
}

func (s *Service) GetSettings(ctx context.Context) (*SettingsDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	settings, err := s.db.Queries.GetReservationSettings(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load reservation settings."), err)
	}
	dto, err := toSettingsDTO(settings)
	if err != nil {
		return nil, err
	}
	return &dto, nil
}

func (s *Service) UpdateSettings(ctx context.Context, actor uuid.UUID, input SettingsInput) (*SettingsDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	if err := validateSettingsInput(input); err != nil {
		return nil, err
	}

	existing, err := s.db.Queries.GetReservationSettings(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load reservation settings."), err)
	}

	weeklyJSON, err := json.Marshal(input.WeeklyHours)
	if err != nil {
		return nil, apperr.BadRequest("Invalid weekly hours.")
	}

	updated, err := s.db.Queries.UpdateReservationSettings(ctx, sqlcdb.UpdateReservationSettingsParams{
		ID:                  existing.ID,
		MinGuests:           input.MinGuests,
		MaxGuests:           input.MaxGuests,
		MinAdvanceMinutes:   input.MinAdvanceMinutes,
		MaxAdvanceDays:      input.MaxAdvanceDays,
		SlotIntervalMinutes: input.SlotIntervalMinutes,
		DurationMinutes:     input.DurationMinutes,
		BufferMinutes:       input.BufferMinutes,
		CancelCutoffMinutes: input.CancelCutoffMinutes,
		Timezone:            strings.TrimSpace(input.Timezone),
		WeeklyHours:         weeklyJSON,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to update reservation settings."), err)
	}

	_ = s.writeAudit(ctx, &actor, "reservation.settings_updated", updated.ID.String(), map[string]any{
		"timezone":            updated.Timezone,
		"minGuests":           updated.MinGuests,
		"maxGuests":           updated.MaxGuests,
		"slotIntervalMinutes": updated.SlotIntervalMinutes,
		"durationMinutes":     updated.DurationMinutes,
	})

	dto, err := toSettingsDTO(updated)
	if err != nil {
		return nil, err
	}
	return &dto, nil
}

func (s *Service) GetAvailability(ctx context.Context, dateStr string, guestCount int) ([]AvailabilitySlot, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	settings, err := s.db.Queries.GetReservationSettings(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load reservation settings."), err)
	}

	loc := loadLocation(settings.Timezone)
	date, err := time.ParseInLocation("2006-01-02", dateStr, loc)
	if err != nil {
		return nil, apperr.Validation("Invalid date.", response.FieldError{Field: "date", Message: "must be YYYY-MM-DD"})
	}

	if guestCount < int(settings.MinGuests) || guestCount > int(settings.MaxGuests) {
		return nil, apperr.Validation("Guest count is out of range.", response.FieldError{
			Field:   "guestCount",
			Message: fmt.Sprintf("must be between %d and %d", settings.MinGuests, settings.MaxGuests),
		})
	}

	hours, err := hoursForDate(settings.WeeklyHours, date)
	if err != nil || hours == nil {
		return []AvailabilitySlot{}, nil
	}

	capacity, err := s.db.Queries.SumActiveTableCapacity(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load table capacity."), err)
	}

	existing, err := s.db.Queries.ListActiveReservationsForDate(ctx, date)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load reservations."), err)
	}

	openClock, err := parseClock(hours.Open)
	if err != nil {
		return nil, apperr.Internal("Invalid opening hours configuration.")
	}
	closeClock, err := parseClock(hours.Close)
	if err != nil {
		return nil, apperr.Internal("Invalid closing hours configuration.")
	}

	now := time.Now().In(loc)
	minStart := now.Add(time.Duration(settings.MinAdvanceMinutes) * time.Minute)
	maxDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc).
		AddDate(0, 0, int(settings.MaxAdvanceDays))
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	if date.After(maxDate) || date.Before(today) {
		return []AvailabilitySlot{}, nil
	}

	slots := make([]AvailabilitySlot, 0)
	interval := time.Duration(settings.SlotIntervalMinutes) * time.Minute
	duration := time.Duration(settings.DurationMinutes) * time.Minute
	buffer := time.Duration(settings.BufferMinutes) * time.Minute
	openAt := combine(date, openClock, loc)
	closeAt := closingAt(date, openClock, closeClock, loc)

	for cursor := openAt; !cursor.Add(duration).After(closeAt); cursor = cursor.Add(interval) {
		label := cursor.Format("15:04")
		if cursor.Before(minStart) {
			slots = append(slots, AvailabilitySlot{Time: label, Available: false, RemainingCapacity: 0})
			continue
		}

		used := occupiedGuests(existing, cursor, duration, buffer, loc)
		remaining := int32(capacity) - used
		if remaining < 0 {
			remaining = 0
		}
		slots = append(slots, AvailabilitySlot{
			Time:              label,
			Available:         remaining >= int32(guestCount),
			RemainingCapacity: remaining,
		})
	}

	return slots, nil
}

func (s *Service) Create(ctx context.Context, input CreateInput) (*ReservationDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	prepared, err := s.prepareCreate(ctx, input.FullName, input.Email, input.Phone, input.Date, input.Time, input.Notes, input.GuestCount, false)
	if err != nil {
		return nil, err
	}

	number, err := generateReservationNumber(prepared.date)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to create reservation number."), err)
	}

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to start reservation transaction."), err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	qtx := s.db.Queries.WithTx(tx)

	created, err := qtx.CreateReservation(ctx, sqlcdb.CreateReservationParams{
		ID:                uuid.New(),
		ReservationNumber: number,
		CustomerUserID:    input.CustomerUserID,
		GuestFullName:     prepared.fullName,
		GuestEmail:        prepared.email,
		GuestPhone:        prepared.phone,
		ReservationDate:   prepared.date,
		ReservationTime:   prepared.clock,
		GuestCount:        prepared.guestCount,
		Status:            "pending",
		Notes:             prepared.notes,
		TableID:           nil,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to create reservation."), err)
	}

	if err := qtx.CreateReservationHistory(ctx, sqlcdb.CreateReservationHistoryParams{
		ID:            uuid.New(),
		ReservationID: created.ID,
		FromStatus:    nil,
		ToStatus:      "pending",
		ActorUserID:   input.CustomerUserID,
		Note:          "Reservation created",
	}); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to write reservation history."), err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to commit reservation."), err)
	}

	_ = s.writeAudit(ctx, input.CustomerUserID, "reservation.created", created.ID.String(), map[string]any{
		"reservationNumber": created.ReservationNumber,
	})

	dto := toDTO(created)
	if s.notifier != nil {
		_ = s.notifier.SendReservationConfirmation(ctx, mailer.ReservationConfirmation{
			GuestFullName:     dto.GuestFullName,
			GuestEmail:        dto.GuestEmail,
			ReservationNumber: dto.ReservationNumber,
			Date:              dto.Date,
			Time:              dto.Time,
			GuestCount:        dto.GuestCount,
			Status:            dto.Status,
		})
	}
	return &dto, nil
}

func (s *Service) CreateAdmin(ctx context.Context, input AdminCreateInput) (*ReservationDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	prepared, err := s.prepareCreate(ctx, input.FullName, input.Email, input.Phone, input.Date, input.Time, input.Notes, input.GuestCount, true)
	if err != nil {
		return nil, err
	}

	status := strings.ToLower(strings.TrimSpace(input.Status))
	if status == "" {
		status = "confirmed"
	}
	if status != "pending" && status != "confirmed" {
		return nil, apperr.Validation("Invalid status.", response.FieldError{
			Field:   "status",
			Message: "must be pending or confirmed",
		})
	}

	var tableID *uuid.UUID
	if input.TableID != nil {
		table, err := s.db.Queries.GetActiveCafeTableByID(ctx, *input.TableID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, apperr.NotFound("Cafe table not found.")
			}
			return nil, apperr.Wrap(apperr.Internal("Failed to load cafe table."), err)
		}
		if table.Capacity < prepared.guestCount {
			return nil, apperr.Validation("Table capacity is too small for this party.", response.FieldError{
				Field:   "tableId",
				Message: fmt.Sprintf("capacity %d is less than %d guests", table.Capacity, prepared.guestCount),
			})
		}
		tableID = input.TableID
	}

	number, err := generateReservationNumber(prepared.date)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to create reservation number."), err)
	}

	actorID := input.ActorUserID
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to start reservation transaction."), err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	qtx := s.db.Queries.WithTx(tx)

	created, err := qtx.CreateReservation(ctx, sqlcdb.CreateReservationParams{
		ID:                uuid.New(),
		ReservationNumber: number,
		CustomerUserID:    nil,
		GuestFullName:     prepared.fullName,
		GuestEmail:        prepared.email,
		GuestPhone:        prepared.phone,
		ReservationDate:   prepared.date,
		ReservationTime:   prepared.clock,
		GuestCount:        prepared.guestCount,
		Status:            status,
		Notes:             prepared.notes,
		TableID:           tableID,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to create reservation."), err)
	}

	if err := qtx.CreateReservationHistory(ctx, sqlcdb.CreateReservationHistoryParams{
		ID:            uuid.New(),
		ReservationID: created.ID,
		FromStatus:    nil,
		ToStatus:      status,
		ActorUserID:   &actorID,
		Note:          "Reservation created by staff",
	}); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to write reservation history."), err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to commit reservation."), err)
	}

	_ = s.writeAudit(ctx, &actorID, "reservation.created", created.ID.String(), map[string]any{
		"reservationNumber": created.ReservationNumber,
		"source":            "admin",
		"status":            status,
	})

	dto := toDTO(created)
	notify := true
	if input.NotifyGuest != nil {
		notify = *input.NotifyGuest
	}
	if notify && s.notifier != nil {
		payload := mailer.ReservationConfirmation{
			GuestFullName:     dto.GuestFullName,
			GuestEmail:        dto.GuestEmail,
			ReservationNumber: dto.ReservationNumber,
			Date:              dto.Date,
			Time:              dto.Time,
			GuestCount:        dto.GuestCount,
			Status:            dto.Status,
		}
		if status == "confirmed" {
			_ = s.notifier.SendReservationConfirmed(ctx, payload)
		} else {
			_ = s.notifier.SendReservationConfirmation(ctx, payload)
		}
	}
	return &dto, nil
}

// prepareCreate validates contact fields, hours, capacity, max-advance, and duplicates.
// When skipMinAdvance is true (admin walk-in), the min-advance window is not enforced.
func (s *Service) prepareCreate(
	ctx context.Context,
	fullNameRaw, emailRaw, phoneRaw, dateRaw, timeRaw, notesRaw string,
	guestCount int,
	skipMinAdvance bool,
) (*preparedCreate, error) {
	settings, err := s.db.Queries.GetReservationSettings(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load reservation settings."), err)
	}

	fullName := strings.TrimSpace(fullNameRaw)
	email := strings.TrimSpace(strings.ToLower(emailRaw))
	phone := strings.TrimSpace(phoneRaw)
	notes := strings.TrimSpace(notesRaw)

	var fieldErrors []response.FieldError
	if fullName == "" {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "fullName", Message: "is required"})
	}
	if !emailPattern.MatchString(email) {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "email", Message: "is invalid"})
	}
	if !phonePattern.MatchString(phone) {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "phone", Message: "is invalid"})
	}
	if guestCount < int(settings.MinGuests) || guestCount > int(settings.MaxGuests) {
		fieldErrors = append(fieldErrors, response.FieldError{
			Field:   "guestCount",
			Message: fmt.Sprintf("must be between %d and %d", settings.MinGuests, settings.MaxGuests),
		})
	}
	if len(fieldErrors) > 0 {
		return nil, apperr.Validation("Invalid reservation payload.", fieldErrors...)
	}

	loc := loadLocation(settings.Timezone)
	date, err := time.ParseInLocation("2006-01-02", strings.TrimSpace(dateRaw), loc)
	if err != nil {
		return nil, apperr.Validation("Invalid date.", response.FieldError{Field: "date", Message: "must be YYYY-MM-DD"})
	}
	clock, err := parseClock(strings.TrimSpace(timeRaw))
	if err != nil {
		return nil, apperr.Validation("Invalid time.", response.FieldError{Field: "time", Message: "must be HH:MM"})
	}

	start := combine(date, clock, loc)
	now := time.Now().In(loc)
	if !skipMinAdvance {
		if start.Before(now.Add(time.Duration(settings.MinAdvanceMinutes) * time.Minute)) {
			return nil, apperr.BadRequest("Reservation time is too soon.")
		}
	}
	maxDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc).AddDate(0, 0, int(settings.MaxAdvanceDays))
	if date.After(maxDate) {
		return nil, apperr.BadRequest("Reservation date is outside the booking window.")
	}

	hours, err := hoursForDate(settings.WeeklyHours, date)
	if err != nil || hours == nil {
		return nil, apperr.BadRequest("Cafe is closed on the selected date.")
	}
	openClock, _ := parseClock(hours.Open)
	closeClock, _ := parseClock(hours.Close)
	duration := time.Duration(settings.DurationMinutes) * time.Minute
	openAt := combine(date, openClock, loc)
	closeAt := closingAt(date, openClock, closeClock, loc)
	if start.Before(openAt) || start.Add(duration).After(closeAt) {
		return nil, apperr.BadRequest("Reservation time is outside business hours.")
	}

	capacity, err := s.db.Queries.SumActiveTableCapacity(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load capacity."), err)
	}
	existing, err := s.db.Queries.ListActiveReservationsForDate(ctx, date)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to validate availability."), err)
	}
	buffer := time.Duration(settings.BufferMinutes) * time.Minute
	used := occupiedGuests(existing, start, duration, buffer, loc)
	if used+int32(guestCount) > int32(capacity) {
		return nil, apperr.Conflict("Selected time slot is fully booked.")
	}

	dup, err := s.db.Queries.CountDuplicateGuestReservation(ctx, sqlcdb.CountDuplicateGuestReservationParams{
		GuestEmail:      email,
		ReservationDate: date,
		ReservationTime: clock,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to check duplicate reservations."), err)
	}
	if dup > 0 {
		return nil, apperr.Conflict("A reservation already exists for this email at the selected time.")
	}

	return &preparedCreate{
		fullName:   fullName,
		email:      email,
		phone:      phone,
		notes:      notes,
		date:       date,
		clock:      clock,
		guestCount: int32(guestCount),
	}, nil
}

func (s *Service) ListCustomer(ctx context.Context, userID uuid.UUID) ([]ReservationDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	items, err := s.db.Queries.ListReservationsByCustomer(ctx, &userID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to list reservations."), err)
	}
	return mapDTOs(items), nil
}

func (s *Service) GetByID(ctx context.Context, reservationID uuid.UUID) (*ReservationDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	item, err := s.db.Queries.GetReservationByID(ctx, reservationID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Reservation not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load reservation."), err)
	}
	dto := toDTO(item)
	return &dto, nil
}

func (s *Service) GetCustomer(ctx context.Context, userID, reservationID uuid.UUID) (*ReservationDTO, error) {
	item, err := s.db.Queries.GetReservationByID(ctx, reservationID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Reservation not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load reservation."), err)
	}
	if item.CustomerUserID == nil || *item.CustomerUserID != userID {
		return nil, apperr.Forbidden("You do not have access to this reservation.")
	}
	dto := toDTO(item)
	return &dto, nil
}

func (s *Service) CancelCustomer(ctx context.Context, userID, reservationID uuid.UUID, reason string) (*ReservationDTO, error) {
	if _, err := s.GetCustomer(ctx, userID, reservationID); err != nil {
		return nil, err
	}
	raw, err := s.db.Queries.GetReservationByID(ctx, reservationID)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load reservation."), err)
	}

	settings, err := s.db.Queries.GetReservationSettings(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load reservation settings."), err)
	}
	loc := loadLocation(settings.Timezone)
	start := combine(raw.ReservationDate, raw.ReservationTime, loc)
	cutoff := start.Add(-time.Duration(settings.CancelCutoffMinutes) * time.Minute)
	if time.Now().In(loc).After(cutoff) {
		return nil, apperr.BadRequest("Cancellation window has closed for this reservation.")
	}

	dto, err := s.transition(ctx, raw, "cancelled", &userID, strings.TrimSpace(reason))
	if err != nil {
		return nil, err
	}
	s.notifyCancelled(ctx, dto)
	return dto, nil
}

func (s *Service) ListAdmin(ctx context.Context, dateStr, status string, page, limit int) ([]ReservationDTO, int64, error) {
	if err := s.requireDB(); err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var datePtr *time.Time
	if strings.TrimSpace(dateStr) != "" {
		parsed, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			return nil, 0, apperr.Validation("Invalid date filter.", response.FieldError{Field: "date", Message: "must be YYYY-MM-DD"})
		}
		datePtr = &parsed
	}
	var statusPtr *string
	if strings.TrimSpace(status) != "" {
		normalized := strings.TrimSpace(status)
		statusPtr = &normalized
	}

	total, err := s.db.Queries.CountReservationsAdmin(ctx, sqlcdb.CountReservationsAdminParams{
		ReservationDate: datePtr,
		Status:          statusPtr,
	})
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Failed to count reservations."), err)
	}

	items, err := s.db.Queries.ListReservationsAdmin(ctx, sqlcdb.ListReservationsAdminParams{
		ReservationDate: datePtr,
		Status:          statusPtr,
		Limit:           int32(limit),
		Offset:          int32((page - 1) * limit),
	})
	if err != nil {
		return nil, 0, apperr.Wrap(apperr.Internal("Failed to list reservations."), err)
	}

	return mapDTOs(items), total, nil
}

func (s *Service) Confirm(ctx context.Context, reservationID, actorID uuid.UUID) (*ReservationDTO, error) {
	dto, err := s.adminTransition(ctx, reservationID, actorID, "confirmed", "")
	if err != nil {
		return nil, err
	}
	if s.notifier != nil {
		_ = s.notifier.SendReservationConfirmed(ctx, mailer.ReservationConfirmation{
			GuestFullName:     dto.GuestFullName,
			GuestEmail:        dto.GuestEmail,
			ReservationNumber: dto.ReservationNumber,
			Date:              dto.Date,
			Time:              dto.Time,
			GuestCount:        dto.GuestCount,
			Status:            dto.Status,
		})
	}
	return dto, nil
}

func (s *Service) CheckIn(ctx context.Context, reservationID, actorID uuid.UUID) (*ReservationDTO, error) {
	return s.adminTransition(ctx, reservationID, actorID, "checked_in", "")
}

func (s *Service) Complete(ctx context.Context, reservationID, actorID uuid.UUID) (*ReservationDTO, error) {
	return s.adminTransition(ctx, reservationID, actorID, "completed", "")
}

func (s *Service) CancelAdmin(ctx context.Context, reservationID, actorID uuid.UUID, reason string) (*ReservationDTO, error) {
	dto, err := s.adminTransition(ctx, reservationID, actorID, "cancelled", reason)
	if err != nil {
		return nil, err
	}
	s.notifyCancelled(ctx, dto)
	return dto, nil
}

func (s *Service) notifyCancelled(ctx context.Context, dto *ReservationDTO) {
	if s.notifier == nil || dto == nil {
		return
	}
	_ = s.notifier.SendReservationCancelled(ctx, mailer.ReservationConfirmation{
		GuestFullName:     dto.GuestFullName,
		GuestEmail:        dto.GuestEmail,
		ReservationNumber: dto.ReservationNumber,
		Date:              dto.Date,
		Time:              dto.Time,
		GuestCount:        dto.GuestCount,
		Status:            dto.Status,
	})
}

func (s *Service) NoShow(ctx context.Context, reservationID, actorID uuid.UUID) (*ReservationDTO, error) {
	return s.adminTransition(ctx, reservationID, actorID, "no_show", "")
}

func (s *Service) ListTables(ctx context.Context) ([]CafeTableDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	items, err := s.db.Queries.ListCafeTablesAdmin(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to load cafe tables."), err)
	}
	result := make([]CafeTableDTO, 0, len(items))
	for _, item := range items {
		result = append(result, toCafeTableDTO(item))
	}
	return result, nil
}

func (s *Service) CreateTable(ctx context.Context, actorID uuid.UUID, input CafeTableInput) (*CafeTableDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	prepared, err := validateCafeTableInput(input, true)
	if err != nil {
		return nil, err
	}

	created, err := s.db.Queries.CreateCafeTable(ctx, sqlcdb.CreateCafeTableParams{
		ID:        uuid.New(),
		Code:      prepared.code,
		Name:      prepared.name,
		Capacity:  prepared.capacity,
		IsActive:  prepared.isActive,
		SortOrder: prepared.sortOrder,
	})
	if err != nil {
		if isUniqueViolation(err) {
			return nil, apperr.Conflict("A cafe table with this code already exists.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to create cafe table."), err)
	}

	_ = s.writeAudit(ctx, &actorID, "reservation.table_created", created.ID.String(), map[string]any{
		"code":     created.Code,
		"capacity": created.Capacity,
	})
	dto := toCafeTableDTO(created)
	return &dto, nil
}

func (s *Service) UpdateTable(ctx context.Context, tableID, actorID uuid.UUID, input CafeTableInput) (*CafeTableDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	prepared, err := validateCafeTableInput(input, false)
	if err != nil {
		return nil, err
	}

	updated, err := s.db.Queries.UpdateCafeTable(ctx, sqlcdb.UpdateCafeTableParams{
		ID:        tableID,
		Name:      prepared.name,
		Capacity:  prepared.capacity,
		IsActive:  prepared.isActive,
		SortOrder: prepared.sortOrder,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Cafe table not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to update cafe table."), err)
	}

	_ = s.writeAudit(ctx, &actorID, "reservation.table_updated", updated.ID.String(), map[string]any{
		"code":     updated.Code,
		"isActive": updated.IsActive,
	})
	dto := toCafeTableDTO(updated)
	return &dto, nil
}

func (s *Service) DeleteTable(ctx context.Context, tableID, actorID uuid.UUID) error {
	if err := s.requireDB(); err != nil {
		return err
	}
	deleted, err := s.db.Queries.SoftDeleteCafeTable(ctx, tableID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return apperr.NotFound("Cafe table not found.")
		}
		return apperr.Wrap(apperr.Internal("Failed to delete cafe table."), err)
	}
	_ = s.writeAudit(ctx, &actorID, "reservation.table_deleted", deleted.ID.String(), map[string]any{
		"code": deleted.Code,
	})
	return nil
}

func (s *Service) AssignTable(ctx context.Context, reservationID, tableID, actorID uuid.UUID) (*ReservationDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}

	reservation, err := s.db.Queries.GetReservationByID(ctx, reservationID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Reservation not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load reservation."), err)
	}

	switch reservation.Status {
	case "cancelled", "completed", "no_show":
		return nil, apperr.Conflict("Cannot assign a table to a closed reservation.")
	}

	table, err := s.db.Queries.GetActiveCafeTableByID(ctx, tableID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Cafe table not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load cafe table."), err)
	}
	if table.Capacity < reservation.GuestCount {
		return nil, apperr.Validation("Table capacity is too small for this party.", response.FieldError{
			Field:   "tableId",
			Message: fmt.Sprintf("capacity %d is less than %d guests", table.Capacity, reservation.GuestCount),
		})
	}

	item, err := s.db.Queries.AssignReservationTable(ctx, sqlcdb.AssignReservationTableParams{
		ID:      reservationID,
		TableID: &tableID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Reservation not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to assign table."), err)
	}
	_ = s.writeAudit(ctx, &actorID, "reservation.table_assigned", item.ID.String(), map[string]any{
		"tableId":   tableID.String(),
		"tableCode": table.Code,
	})
	dto := toDTO(item)
	return &dto, nil
}

func (s *Service) adminTransition(ctx context.Context, reservationID, actorID uuid.UUID, next, reason string) (*ReservationDTO, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	item, err := s.db.Queries.GetReservationByID(ctx, reservationID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperr.NotFound("Reservation not found.")
		}
		return nil, apperr.Wrap(apperr.Internal("Failed to load reservation."), err)
	}
	return s.transition(ctx, item, next, &actorID, reason)
}

func (s *Service) transition(
	ctx context.Context,
	item sqlcdb.Reservation,
	next string,
	actor *uuid.UUID,
	reason string,
) (*ReservationDTO, error) {
	if !isAllowedTransition(item.Status, next) {
		return nil, apperr.Conflict(fmt.Sprintf("Cannot transition from %s to %s.", item.Status, next))
	}

	var cancelledAt *time.Time
	cancelReason := item.CancelReason
	if next == "cancelled" {
		now := time.Now().UTC()
		cancelledAt = &now
		if reason != "" {
			cancelReason = reason
		}
	}

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to start status transaction."), err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	qtx := s.db.Queries.WithTx(tx)

	updated, err := qtx.UpdateReservationStatus(ctx, sqlcdb.UpdateReservationStatusParams{
		ID:           item.ID,
		Status:       next,
		CancelledAt:  cancelledAt,
		CancelReason: cancelReason,
	})
	if err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to update reservation status."), err)
	}

	from := item.Status
	if err := qtx.CreateReservationHistory(ctx, sqlcdb.CreateReservationHistoryParams{
		ID:            uuid.New(),
		ReservationID: item.ID,
		FromStatus:    &from,
		ToStatus:      next,
		ActorUserID:   actor,
		Note:          reason,
	}); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to write reservation history."), err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, apperr.Wrap(apperr.Internal("Failed to commit reservation status."), err)
	}

	_ = s.writeAudit(ctx, actor, "reservation.status_changed", item.ID.String(), map[string]any{
		"from": item.Status,
		"to":   next,
	})

	dto := toDTO(updated)
	if next == "completed" && updated.CustomerUserID != nil && s.onCompleted != nil {
		s.onCompleted(ctx, *updated.CustomerUserID, updated.ID)
	}
	return &dto, nil
}

func isAllowedTransition(from, to string) bool {
	allowed := map[string][]string{
		"pending":    {"confirmed", "cancelled"},
		"confirmed":  {"checked_in", "cancelled", "no_show"},
		"checked_in": {"completed", "cancelled"},
	}
	for _, candidate := range allowed[from] {
		if candidate == to {
			return true
		}
	}
	return false
}

func occupiedGuests(items []sqlcdb.Reservation, start time.Time, duration, buffer time.Duration, loc *time.Location) int32 {
	windowStart := start.Add(-buffer)
	windowEnd := start.Add(duration).Add(buffer)
	var used int32
	for _, item := range items {
		itemStart := combine(item.ReservationDate, item.ReservationTime, loc)
		itemEnd := itemStart.Add(duration)
		if itemStart.Before(windowEnd) && itemEnd.After(windowStart) {
			used += item.GuestCount
		}
	}
	return used
}

func hoursForDate(raw []byte, date time.Time) (*dayHours, error) {
	var weekly map[string]dayHours
	if err := json.Unmarshal(raw, &weekly); err != nil {
		return nil, err
	}
	key := strings.ToLower(date.Weekday().String())
	hours, ok := weekly[key]
	if !ok || hours.Open == "" || hours.Close == "" {
		return nil, nil
	}
	return &hours, nil
}

func parseClock(value string) (time.Time, error) {
	parsed, err := time.Parse("15:04", value)
	if err != nil {
		parsed, err = time.Parse("15:04:05", value)
		if err != nil {
			return time.Time{}, err
		}
	}
	return time.Date(0, 1, 1, parsed.Hour(), parsed.Minute(), parsed.Second(), 0, time.UTC), nil
}

func combine(date, clock time.Time, loc *time.Location) time.Time {
	return time.Date(date.Year(), date.Month(), date.Day(), clock.Hour(), clock.Minute(), clock.Second(), 0, loc)
}

// closingAt returns the absolute close time for a service day.
// When close is at/before open (e.g. 08:00–00:00), close is treated as next calendar day.
func closingAt(date, openClock, closeClock time.Time, loc *time.Location) time.Time {
	openAt := combine(date, openClock, loc)
	closeAt := combine(date, closeClock, loc)
	if !closeAt.After(openAt) {
		return closeAt.AddDate(0, 0, 1)
	}
	return closeAt
}

func loadLocation(name string) *time.Location {
	loc, err := time.LoadLocation(name)
	if err != nil {
		return time.FixedZone("UZT", 5*3600)
	}
	return loc
}

func generateReservationNumber(date time.Time) (string, error) {
	bytes := make([]byte, 2)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return fmt.Sprintf("7OZ-%s-%s", date.Format("20060102"), strings.ToUpper(hex.EncodeToString(bytes))), nil
}

func mapDTOs(items []sqlcdb.Reservation) []ReservationDTO {
	result := make([]ReservationDTO, 0, len(items))
	for _, item := range items {
		result = append(result, toDTO(item))
	}
	return result
}

func toSettingsDTO(settings sqlcdb.ReservationSetting) (SettingsDTO, error) {
	weekly := map[string]dayHours{}
	if len(settings.WeeklyHours) > 0 {
		if err := json.Unmarshal(settings.WeeklyHours, &weekly); err != nil {
			return SettingsDTO{}, apperr.Wrap(apperr.Internal("Invalid weekly hours configuration."), err)
		}
	}
	return SettingsDTO{
		ID:                  settings.ID.String(),
		MinGuests:           settings.MinGuests,
		MaxGuests:           settings.MaxGuests,
		MinAdvanceMinutes:   settings.MinAdvanceMinutes,
		MaxAdvanceDays:      settings.MaxAdvanceDays,
		SlotIntervalMinutes: settings.SlotIntervalMinutes,
		DurationMinutes:     settings.DurationMinutes,
		BufferMinutes:       settings.BufferMinutes,
		CancelCutoffMinutes: settings.CancelCutoffMinutes,
		Timezone:            settings.Timezone,
		WeeklyHours:         weekly,
		UpdatedAt:           settings.UpdatedAt.UTC().Format(time.RFC3339),
	}, nil
}

func validateSettingsInput(input SettingsInput) error {
	if input.MinGuests < 1 {
		return apperr.Validation("Invalid min guests.", response.FieldError{Field: "minGuests", Message: "must be >= 1"})
	}
	if input.MaxGuests < input.MinGuests {
		return apperr.Validation("Invalid max guests.", response.FieldError{Field: "maxGuests", Message: "must be >= minGuests"})
	}
	if input.MinAdvanceMinutes < 0 {
		return apperr.Validation("Invalid min advance minutes.", response.FieldError{Field: "minAdvanceMinutes", Message: "must be >= 0"})
	}
	if input.MaxAdvanceDays < 1 {
		return apperr.Validation("Invalid max advance days.", response.FieldError{Field: "maxAdvanceDays", Message: "must be >= 1"})
	}
	if input.SlotIntervalMinutes < 5 {
		return apperr.Validation("Invalid slot interval.", response.FieldError{Field: "slotIntervalMinutes", Message: "must be >= 5"})
	}
	if input.DurationMinutes < 15 {
		return apperr.Validation("Invalid duration.", response.FieldError{Field: "durationMinutes", Message: "must be >= 15"})
	}
	if input.BufferMinutes < 0 {
		return apperr.Validation("Invalid buffer minutes.", response.FieldError{Field: "bufferMinutes", Message: "must be >= 0"})
	}
	if input.CancelCutoffMinutes < 0 {
		return apperr.Validation("Invalid cancel cutoff.", response.FieldError{Field: "cancelCutoffMinutes", Message: "must be >= 0"})
	}
	tz := strings.TrimSpace(input.Timezone)
	if tz == "" {
		return apperr.Validation("Timezone is required.", response.FieldError{Field: "timezone", Message: "is required"})
	}
	if _, err := time.LoadLocation(tz); err != nil {
		return apperr.Validation("Invalid timezone.", response.FieldError{Field: "timezone", Message: "must be a valid IANA timezone"})
	}
	if input.WeeklyHours == nil {
		return apperr.Validation("Weekly hours are required.", response.FieldError{Field: "weeklyHours", Message: "is required"})
	}
	for _, day := range weekdayKeys {
		hours, ok := input.WeeklyHours[day]
		if !ok {
			return apperr.Validation("Weekly hours incomplete.", response.FieldError{
				Field:   "weeklyHours." + day,
				Message: "is required",
			})
		}
		if _, err := parseClock(hours.Open); err != nil {
			return apperr.Validation("Invalid open time.", response.FieldError{
				Field:   "weeklyHours." + day + ".open",
				Message: "must be HH:MM",
			})
		}
		if _, err := parseClock(hours.Close); err != nil {
			return apperr.Validation("Invalid close time.", response.FieldError{
				Field:   "weeklyHours." + day + ".close",
				Message: "must be HH:MM",
			})
		}
	}
	return nil
}

func toCafeTableDTO(item sqlcdb.CafeTable) CafeTableDTO {
	return CafeTableDTO{
		ID:        item.ID.String(),
		Code:      item.Code,
		Name:      item.Name,
		Capacity:  item.Capacity,
		IsActive:  item.IsActive,
		SortOrder: item.SortOrder,
		CreatedAt: item.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: item.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

type preparedCafeTable struct {
	code      string
	name      string
	capacity  int32
	isActive  bool
	sortOrder int32
}

func validateCafeTableInput(input CafeTableInput, requireCode bool) (*preparedCafeTable, error) {
	code := strings.TrimSpace(strings.ToUpper(input.Code))
	name := strings.TrimSpace(input.Name)

	var fieldErrors []response.FieldError
	if requireCode && code == "" {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "code", Message: "is required"})
	}
	if name == "" {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "name", Message: "is required"})
	}
	if input.Capacity < 1 {
		fieldErrors = append(fieldErrors, response.FieldError{Field: "capacity", Message: "must be at least 1"})
	}
	if len(fieldErrors) > 0 {
		return nil, apperr.Validation("Invalid cafe table payload.", fieldErrors...)
	}

	return &preparedCafeTable{
		code:      code,
		name:      name,
		capacity:  input.Capacity,
		isActive:  input.IsActive,
		sortOrder: input.SortOrder,
	}, nil
}

func isUniqueViolation(err error) bool {
	return err != nil && strings.Contains(err.Error(), "duplicate key")
}

func toDTO(item sqlcdb.Reservation) ReservationDTO {
	dto := ReservationDTO{
		ID:                item.ID.String(),
		ReservationNumber: item.ReservationNumber,
		GuestFullName:     item.GuestFullName,
		GuestEmail:        item.GuestEmail,
		GuestPhone:        item.GuestPhone,
		Date:              item.ReservationDate.Format("2006-01-02"),
		Time:              item.ReservationTime.Format("15:04"),
		GuestCount:        item.GuestCount,
		Status:            item.Status,
		Notes:             item.Notes,
		CreatedAt:         item.CreatedAt.UTC().Format(time.RFC3339),
	}
	if item.TableID != nil {
		id := item.TableID.String()
		dto.TableID = &id
	}
	return dto
}

func (s *Service) requireDB() error {
	if s.db == nil {
		return apperr.Internal("Database is unavailable.")
	}
	return nil
}

func (s *Service) writeAudit(ctx context.Context, actor *uuid.UUID, action, resourceID string, payload map[string]any) error {
	if s.db == nil {
		return nil
	}
	if payload == nil {
		payload = map[string]any{}
	}
	metadata, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	var resourceIDPtr *string
	if resourceID != "" {
		resourceIDPtr = &resourceID
	}
	return s.db.Queries.CreateAuditLog(ctx, sqlcdb.CreateAuditLogParams{
		ID:           uuid.New(),
		ActorUserID:  actor,
		Action:       action,
		ResourceType: "reservation",
		ResourceID:   resourceIDPtr,
		IpAddress:    "",
		UserAgent:    "",
		Metadata:     metadata,
	})
}
