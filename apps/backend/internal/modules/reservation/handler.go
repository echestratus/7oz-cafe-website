package reservation

import (
	"context"
	"strconv"
	"strings"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/authctx"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

type createRequest struct {
	FullName   string `json:"fullName"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Date       string `json:"date"`
	Time       string `json:"time"`
	GuestCount int    `json:"guestCount"`
	Notes      string `json:"notes"`
}

type adminCreateRequest struct {
	FullName    string  `json:"fullName"`
	Email       string  `json:"email"`
	Phone       string  `json:"phone"`
	Date        string  `json:"date"`
	Time        string  `json:"time"`
	GuestCount  int     `json:"guestCount"`
	Notes       string  `json:"notes"`
	TableID     *string `json:"tableId"`
	Status      string  `json:"status"`
	NotifyGuest *bool   `json:"notifyGuest"`
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetAvailability(c fiber.Ctx) error {
	date := strings.TrimSpace(c.Query("date"))
	if date == "" {
		return apperr.Validation("Date is required.", response.FieldError{Field: "date", Message: "is required"})
	}

	guestCount := 2
	if raw := strings.TrimSpace(c.Query("guestCount")); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 1 {
			return apperr.Validation("Invalid guest count.", response.FieldError{Field: "guestCount", Message: "must be a positive integer"})
		}
		guestCount = parsed
	}

	slots, err := h.service.GetAvailability(c.Context(), date, guestCount)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", slots))
}

func (h *Handler) CreatePublic(c fiber.Ctx) error {
	var req createRequest
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}

	var customerID *uuid.UUID
	if principal, ok := authctx.PrincipalFromCtx(c); ok {
		customerID = &principal.UserID
	}

	item, err := h.service.Create(c.Context(), CreateInput{
		FullName:       req.FullName,
		Email:          req.Email,
		Phone:          req.Phone,
		Date:           req.Date,
		Time:           req.Time,
		GuestCount:     req.GuestCount,
		Notes:          req.Notes,
		CustomerUserID: customerID,
	})
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusCreated, response.OK("Reservation created.", item))
}

func (h *Handler) CreateCustomer(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	var req createRequest
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}

	item, err := h.service.Create(c.Context(), CreateInput{
		FullName:       req.FullName,
		Email:          req.Email,
		Phone:          req.Phone,
		Date:           req.Date,
		Time:           req.Time,
		GuestCount:     req.GuestCount,
		Notes:          req.Notes,
		CustomerUserID: &principal.UserID,
	})
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusCreated, response.OK("Reservation created.", item))
}

func (h *Handler) ListCustomer(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	items, err := h.service.ListCustomer(c.Context(), principal.UserID)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", items))
}

func (h *Handler) GetCustomer(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	reservationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid reservation id.")
	}

	item, err := h.service.GetCustomer(c.Context(), principal.UserID, reservationID)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", item))
}

func (h *Handler) CancelCustomer(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	reservationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid reservation id.")
	}

	var req struct {
		Reason string `json:"reason"`
	}
	_ = c.Bind().Body(&req)

	item, err := h.service.CancelCustomer(c.Context(), principal.UserID, reservationID, req.Reason)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Reservation cancelled.", item))
}

func (h *Handler) ListAdmin(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	items, total, err := h.service.ListAdmin(
		c.Context(),
		c.Query("date"),
		c.Query("status"),
		page,
		limit,
	)
	if err != nil {
		return err
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	return response.JSON(c, fiber.StatusOK, response.OK("OK", map[string]any{
		"items": items,
		"page":  page,
		"limit": limit,
		"total": total,
	}))
}

func (h *Handler) CreateAdmin(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	var req adminCreateRequest
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}

	var tableID *uuid.UUID
	if req.TableID != nil {
		raw := strings.TrimSpace(*req.TableID)
		if raw != "" {
			parsed, err := uuid.Parse(raw)
			if err != nil {
				return apperr.Validation("Invalid table id.", response.FieldError{Field: "tableId", Message: "must be a UUID"})
			}
			tableID = &parsed
		}
	}

	item, err := h.service.CreateAdmin(c.Context(), AdminCreateInput{
		FullName:    req.FullName,
		Email:       req.Email,
		Phone:       req.Phone,
		Date:        req.Date,
		Time:        req.Time,
		GuestCount:  req.GuestCount,
		Notes:       req.Notes,
		TableID:     tableID,
		Status:      req.Status,
		NotifyGuest: req.NotifyGuest,
		ActorUserID: principal.UserID,
	})
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusCreated, response.OK("Reservation created.", item))
}

func (h *Handler) GetSettings(c fiber.Ctx) error {
	item, err := h.service.GetSettings(c.Context())
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", item))
}

func (h *Handler) UpdateSettings(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	var req struct {
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
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}

	item, err := h.service.UpdateSettings(c.Context(), principal.UserID, SettingsInput{
		MinGuests:           req.MinGuests,
		MaxGuests:           req.MaxGuests,
		MinAdvanceMinutes:   req.MinAdvanceMinutes,
		MaxAdvanceDays:      req.MaxAdvanceDays,
		SlotIntervalMinutes: req.SlotIntervalMinutes,
		DurationMinutes:     req.DurationMinutes,
		BufferMinutes:       req.BufferMinutes,
		CancelCutoffMinutes: req.CancelCutoffMinutes,
		Timezone:            req.Timezone,
		WeeklyHours:         req.WeeklyHours,
	})
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Reservation settings updated.", item))
}

func (h *Handler) GetAdmin(c fiber.Ctx) error {
	reservationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid reservation id.")
	}

	item, err := h.service.GetByID(c.Context(), reservationID)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", item))
}

func (h *Handler) ListTables(c fiber.Ctx) error {
	items, err := h.service.ListTables(c.Context())
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", items))
}

func (h *Handler) CreateTable(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	input, err := bindCafeTable(c, true)
	if err != nil {
		return err
	}

	item, err := h.service.CreateTable(c.Context(), principal.UserID, input)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusCreated, response.OK("Cafe table created.", item))
}

func (h *Handler) UpdateTable(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	tableID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid table id.")
	}

	input, err := bindCafeTable(c, false)
	if err != nil {
		return err
	}

	item, err := h.service.UpdateTable(c.Context(), tableID, principal.UserID, input)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Cafe table updated.", item))
}

func (h *Handler) DeleteTable(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	tableID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid table id.")
	}

	if err := h.service.DeleteTable(c.Context(), tableID, principal.UserID); err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Cafe table deleted.", map[string]any{}))
}

func bindCafeTable(c fiber.Ctx, requireCode bool) (CafeTableInput, error) {
	var req struct {
		Code      string `json:"code"`
		Name      string `json:"name"`
		Capacity  int32  `json:"capacity"`
		IsActive  *bool  `json:"isActive"`
		SortOrder int32  `json:"sortOrder"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return CafeTableInput{}, apperr.BadRequest("Invalid JSON body.")
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	input := CafeTableInput{
		Code:      req.Code,
		Name:      req.Name,
		Capacity:  req.Capacity,
		IsActive:  isActive,
		SortOrder: req.SortOrder,
	}
	if requireCode && strings.TrimSpace(input.Code) == "" {
		return CafeTableInput{}, apperr.Validation("Invalid cafe table payload.", response.FieldError{
			Field:   "code",
			Message: "is required",
		})
	}
	return input, nil
}

func (h *Handler) Confirm(c fiber.Ctx) error {
	return h.runAdminTransition(c, h.service.Confirm, "Reservation confirmed.")
}

func (h *Handler) CheckIn(c fiber.Ctx) error {
	return h.runAdminTransition(c, h.service.CheckIn, "Guest checked in.")
}

func (h *Handler) Complete(c fiber.Ctx) error {
	return h.runAdminTransition(c, h.service.Complete, "Reservation completed.")
}

func (h *Handler) NoShow(c fiber.Ctx) error {
	return h.runAdminTransition(c, h.service.NoShow, "Reservation marked as no-show.")
}

func (h *Handler) CancelAdmin(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	reservationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid reservation id.")
	}

	var req struct {
		Reason string `json:"reason"`
	}
	_ = c.Bind().Body(&req)

	item, err := h.service.CancelAdmin(c.Context(), reservationID, principal.UserID, req.Reason)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Reservation cancelled.", item))
}

func (h *Handler) AssignTable(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	reservationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid reservation id.")
	}

	var req struct {
		TableID string `json:"tableId"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}

	tableID, err := uuid.Parse(strings.TrimSpace(req.TableID))
	if err != nil {
		return apperr.Validation("Invalid table id.", response.FieldError{Field: "tableId", Message: "must be a UUID"})
	}

	item, err := h.service.AssignTable(c.Context(), reservationID, tableID, principal.UserID)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Table assigned.", item))
}

func (h *Handler) runAdminTransition(
	c fiber.Ctx,
	fn func(ctx context.Context, reservationID, actorID uuid.UUID) (*ReservationDTO, error),
	message string,
) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	reservationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid reservation id.")
	}

	item, err := fn(c.Context(), reservationID, principal.UserID)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK(message, item))
}
