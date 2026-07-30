package contact

import (
	"strconv"
	"strings"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Create(c fiber.Ctx) error {
	var req struct {
		FullName string `json:"fullName"`
		Email    string `json:"email"`
		Phone    string `json:"phone"`
		Message  string `json:"message"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}

	result, err := h.service.Create(c.Context(), CreateInput{
		FullName:  req.FullName,
		Email:     req.Email,
		Phone:     req.Phone,
		Message:   req.Message,
		IPAddress: c.IP(),
		UserAgent: c.Get("User-Agent"),
	})
	if err != nil {
		return err
	}

	return response.JSON(c, fiber.StatusCreated, response.OK("Message received. We will get back to you soon.", result))
}

func (h *Handler) ListAdmin(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	items, total, err := h.service.ListAdmin(c.Context(), c.Query("status"), c.Query("search"), page, limit)
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

func (h *Handler) GetAdmin(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid contact message id.")
	}
	item, err := h.service.GetAdmin(c.Context(), id)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", item))
}

func (h *Handler) UpdateStatus(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid contact message id.")
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}

	item, err := h.service.UpdateStatus(c.Context(), id, strings.TrimSpace(req.Status))
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Contact message status updated.", item))
}
