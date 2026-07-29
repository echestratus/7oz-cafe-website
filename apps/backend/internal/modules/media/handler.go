package media

import (
	"strconv"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/authctx"
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

func (h *Handler) List(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	result, err := h.service.List(c.Context(), page, limit)
	if err != nil {
		return err
	}

	return response.JSON(c, fiber.StatusOK, response.OKWithMeta("OK", result.Items, map[string]any{
		"total": result.Total,
		"page":  result.Page,
		"limit": result.Limit,
	}))
}

func (h *Handler) Upload(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	file, err := c.FormFile("file")
	if err != nil {
		return apperr.Validation("File is required.", response.FieldError{
			Field:   "file",
			Message: "is required",
		})
	}

	src, err := file.Open()
	if err != nil {
		return apperr.BadRequest("Unable to read uploaded file.")
	}
	defer src.Close()

	mimeType := file.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	asset, err := h.service.Upload(
		c.Context(),
		file.Filename,
		mimeType,
		file.Size,
		src,
		c.FormValue("altText"),
		principal.UserID,
	)
	if err != nil {
		return err
	}

	return response.JSON(c, fiber.StatusCreated, response.OK("Media uploaded.", asset))
}

func (h *Handler) Delete(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid media id.")
	}

	if err := h.service.SoftDelete(c.Context(), id, principal.UserID); err != nil {
		return err
	}

	return response.JSON(c, fiber.StatusOK, response.OK("Media deleted.", map[string]any{}))
}

func (h *Handler) Serve(c fiber.Ctx) error {
	path, err := h.service.AbsolutePath(c.Params("storageKey"))
	if err != nil {
		return err
	}
	return c.SendFile(path)
}
