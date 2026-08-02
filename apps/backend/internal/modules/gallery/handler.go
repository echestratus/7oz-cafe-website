package gallery

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

type writeBody struct {
	ImageURL     string  `json:"imageUrl"`
	MediaID      *string `json:"mediaId"`
	LocationSlug string  `json:"locationSlug"`
	Category     string  `json:"category"`
	AltText      string  `json:"altText"`
	Caption      string  `json:"caption"`
	SortOrder    int32   `json:"sortOrder"`
	IsVisible    *bool   `json:"isVisible"`
}

func (h *Handler) ListPublic(c fiber.Ctx) error {
	items, err := h.service.ListPublic(c.Context(), c.Query("locationSlug"))
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", items))
}

func (h *Handler) ListAdmin(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	items, total, err := h.service.ListAdmin(c.Context(), c.Query("locationSlug"), page, limit)
	if err != nil {
		return err
	}
	page, limit = normalizePagination(page, limit)
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
		return apperr.BadRequest("Invalid gallery item id.")
	}
	item, err := h.service.GetAdmin(c.Context(), id)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", item))
}

func (h *Handler) Create(c fiber.Ctx) error {
	var body writeBody
	if err := c.Bind().Body(&body); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}
	input, err := toWriteInput(body)
	if err != nil {
		return err
	}
	item, err := h.service.Create(c.Context(), input)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusCreated, response.OK("Gallery item created.", item))
}

func (h *Handler) Update(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid gallery item id.")
	}
	var body writeBody
	if err := c.Bind().Body(&body); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}
	input, err := toWriteInput(body)
	if err != nil {
		return err
	}
	item, err := h.service.Update(c.Context(), id, input)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Gallery item updated.", item))
}

func (h *Handler) Delete(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid gallery item id.")
	}
	if err := h.service.Delete(c.Context(), id); err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Gallery item deleted.", map[string]any{}))
}

func toWriteInput(body writeBody) (WriteInput, error) {
	visible := true
	if body.IsVisible != nil {
		visible = *body.IsVisible
	}

	var mediaID *uuid.UUID
	if body.MediaID != nil {
		raw := strings.TrimSpace(*body.MediaID)
		if raw != "" {
			parsed, err := uuid.Parse(raw)
			if err != nil {
				return WriteInput{}, apperr.Validation("Invalid media id.", response.FieldError{
					Field: "mediaId", Message: "must be a UUID",
				})
			}
			mediaID = &parsed
		}
	}

	return WriteInput{
		ImageURL:     body.ImageURL,
		MediaID:      mediaID,
		LocationSlug: body.LocationSlug,
		Category:     body.Category,
		AltText:      body.AltText,
		Caption:      body.Caption,
		SortOrder:    body.SortOrder,
		IsVisible:    visible,
	}, nil
}
