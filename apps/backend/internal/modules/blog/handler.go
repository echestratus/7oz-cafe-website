package blog

import (
	"strconv"
	"strings"
	"time"

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
	Slug         string         `json:"slug"`
	Title        string         `json:"title"`
	Excerpt      string         `json:"excerpt"`
	Body         string         `json:"body"`
	Kind         string         `json:"kind"`
	CoverURL     *string        `json:"coverUrl"`
	CoverMediaID *string        `json:"coverMediaId"`
	Status       string         `json:"status"`
	PublishedAt  *string        `json:"publishedAt"`
	SEO          map[string]any `json:"seo"`
}

type patchBody struct {
	Slug         *string        `json:"slug"`
	Title        *string        `json:"title"`
	Excerpt      *string        `json:"excerpt"`
	Body         *string        `json:"body"`
	Kind         *string        `json:"kind"`
	CoverURL     *string        `json:"coverUrl"`
	CoverMediaID *string        `json:"coverMediaId"`
	Status       *string        `json:"status"`
	PublishedAt  *string        `json:"publishedAt"`
	SEO          map[string]any `json:"seo"`
}

func (h *Handler) ListPublic(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "12"))

	items, total, err := h.service.ListPublished(c.Context(), page, limit)
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

func (h *Handler) GetPublicBySlug(c fiber.Ctx) error {
	item, err := h.service.GetPublishedBySlug(c.Context(), c.Params("slug"))
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", item))
}

func (h *Handler) ListAdmin(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	items, total, err := h.service.ListAdmin(
		c.Context(),
		c.Query("status"),
		c.Query("kind"),
		c.Query("search"),
		page,
		limit,
	)
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
		return apperr.BadRequest("Invalid blog post id.")
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
		return apperr.BadRequest("Invalid request body.")
	}

	publishedAt, err := parseOptionalTime(body.PublishedAt)
	if err != nil {
		return err
	}

	item, err := h.service.Create(c.Context(), CreatePostInput{
		Slug:         body.Slug,
		Title:        body.Title,
		Excerpt:      body.Excerpt,
		Body:         body.Body,
		Kind:         body.Kind,
		CoverURL:     body.CoverURL,
		CoverMediaID: body.CoverMediaID,
		Status:       body.Status,
		PublishedAt:  publishedAt,
		SEO:          body.SEO,
	})
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusCreated, response.OK("Blog post created.", item))
}

func (h *Handler) Update(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid blog post id.")
	}

	var body patchBody
	if err := c.Bind().Body(&body); err != nil {
		return apperr.BadRequest("Invalid request body.")
	}

	input := UpdatePostInput{
		Slug:         body.Slug,
		Title:        body.Title,
		Excerpt:      body.Excerpt,
		Body:         body.Body,
		Kind:         body.Kind,
		CoverURL:     body.CoverURL,
		CoverMediaID: body.CoverMediaID,
		Status:       body.Status,
		SEO:          body.SEO,
	}

	if body.PublishedAt != nil {
		if strings.TrimSpace(*body.PublishedAt) == "" {
			input.ClearPublishedAt = true
		} else {
			publishedAt, parseErr := parseOptionalTime(body.PublishedAt)
			if parseErr != nil {
				return parseErr
			}
			input.PublishedAt = publishedAt
		}
	}

	item, err := h.service.Update(c.Context(), id, input)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Blog post updated.", item))
}

func (h *Handler) Delete(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid blog post id.")
	}
	if err := h.service.Delete(c.Context(), id); err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Blog post deleted.", map[string]any{}))
}

func parseOptionalTime(value *string) (*time.Time, error) {
	if value == nil {
		return nil, nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil, nil
	}
	parsed, err := time.Parse(time.RFC3339, trimmed)
	if err != nil {
		return nil, apperr.BadRequest("publishedAt must be an RFC3339 timestamp.")
	}
	utc := parsed.UTC()
	return &utc, nil
}
