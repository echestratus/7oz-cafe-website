package cms

import (
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

func (h *Handler) GetPublicPage(c fiber.Ctx) error {
	slug := c.Params("slug")
	if slug == "" {
		slug = c.Params("page")
	}

	page, err := h.service.GetPublishedPage(c.Context(), slug)
	if err != nil {
		return err
	}

	return response.JSON(c, fiber.StatusOK, response.OK("OK", page))
}

func (h *Handler) ListPages(c fiber.Ctx) error {
	pages, err := h.service.ListPages(c.Context())
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", pages))
}

func (h *Handler) GetDraftPage(c fiber.Ctx) error {
	page, err := h.service.GetDraftPage(c.Context(), c.Params("slug"))
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", page))
}

func (h *Handler) UpdatePageSEO(c fiber.Ctx) error {
	var req struct {
		SEO map[string]any `json:"seo"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}
	if req.SEO == nil {
		return apperr.Validation("SEO is required.", response.FieldError{Field: "seo", Message: "is required"})
	}

	page, err := h.service.UpdatePageSEO(c.Context(), c.Params("slug"), req.SEO)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("SEO updated.", page))
}

func (h *Handler) UpdateSection(c fiber.Ctx) error {
	sectionID, err := uuid.Parse(c.Params("sectionID"))
	if err != nil {
		return apperr.BadRequest("Invalid section id.")
	}

	var req struct {
		IsEnabled *bool          `json:"isEnabled"`
		Data      map[string]any `json:"data"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}

	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	if req.Data != nil {
		section, err := h.service.UpdateSectionContent(c.Context(), UpdateSectionContentInput{
			SectionID: sectionID,
			Data:      req.Data,
			ActorID:   principal.UserID,
		})
		if err != nil {
			return err
		}
		if req.IsEnabled != nil {
			section, err = h.service.UpdateSectionEnabled(c.Context(), UpdateSectionEnabledInput{
				SectionID: sectionID,
				IsEnabled: *req.IsEnabled,
			})
			if err != nil {
				return err
			}
		}
		return response.JSON(c, fiber.StatusOK, response.OK("Section updated.", section))
	}

	if req.IsEnabled == nil {
		return apperr.Validation("Nothing to update.", response.FieldError{
			Field:   "data",
			Message: "or isEnabled is required",
		})
	}

	section, err := h.service.UpdateSectionEnabled(c.Context(), UpdateSectionEnabledInput{
		SectionID: sectionID,
		IsEnabled: *req.IsEnabled,
	})
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Section updated.", section))
}

func (h *Handler) Publish(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	var req struct {
		Summary string `json:"summary"`
	}
	_ = c.Bind().Body(&req)

	version, err := h.service.Publish(c.Context(), c.Params("slug"), PublishInput{
		Summary: req.Summary,
		ActorID: principal.UserID,
	})
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Page published.", version))
}

func (h *Handler) Rollback(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	var req struct {
		VersionNumber int32  `json:"versionNumber"`
		Summary       string `json:"summary"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}

	version, err := h.service.Rollback(c.Context(), c.Params("slug"), RollbackInput{
		VersionNumber: req.VersionNumber,
		Summary:       req.Summary,
		ActorID:       principal.UserID,
	})
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Page rolled back and republished.", version))
}

func (h *Handler) ListVersions(c fiber.Ctx) error {
	versions, err := h.service.ListVersions(c.Context(), c.Params("slug"))
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", versions))
}

func (h *Handler) PublishByBody(c fiber.Ctx) error {
	var req struct {
		Slug    string `json:"slug"`
		Summary string `json:"summary"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}
	if req.Slug == "" {
		return apperr.Validation("Slug is required.", response.FieldError{Field: "slug", Message: "is required"})
	}

	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	version, err := h.service.Publish(c.Context(), req.Slug, PublishInput{
		Summary: req.Summary,
		ActorID: principal.UserID,
	})
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Page published.", version))
}

func (h *Handler) RollbackByBody(c fiber.Ctx) error {
	var req struct {
		Slug          string `json:"slug"`
		VersionNumber int32  `json:"versionNumber"`
		Summary       string `json:"summary"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}
	if req.Slug == "" {
		return apperr.Validation("Slug is required.", response.FieldError{Field: "slug", Message: "is required"})
	}

	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	version, err := h.service.Rollback(c.Context(), req.Slug, RollbackInput{
		VersionNumber: req.VersionNumber,
		Summary:       req.Summary,
		ActorID:       principal.UserID,
	})
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Page rolled back and republished.", version))
}
