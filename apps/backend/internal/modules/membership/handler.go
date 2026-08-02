package membership

import (
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

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) ListPublicLevels(c fiber.Ctx) error {
	items, err := h.service.ListPublicLevels(c.Context())
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", items))
}

func (h *Handler) ListPublicBenefits(c fiber.Ctx) error {
	items, err := h.service.ListPublicBenefits(c.Context())
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", items))
}

func (h *Handler) GetCustomerMembership(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}
	item, err := h.service.GetCustomerMembership(c.Context(), principal.UserID)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", item))
}

func (h *Handler) GetCustomerBenefits(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}
	items, err := h.service.GetCustomerBenefits(c.Context(), principal.UserID)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", items))
}

func (h *Handler) GetCustomerHistory(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}
	items, err := h.service.GetCustomerHistory(c.Context(), principal.UserID)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", items))
}

func (h *Handler) ListAdmin(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	items, total, err := h.service.ListAdmin(c.Context(), c.Query("status"), c.Query("levelId"), page, limit)
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
	membershipID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid membership id.")
	}
	item, err := h.service.GetAdmin(c.Context(), membershipID)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", item))
}

func (h *Handler) GetAdminHistory(c fiber.Ctx) error {
	membershipID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid membership id.")
	}
	items, err := h.service.GetAdminHistory(c.Context(), membershipID)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", items))
}

func (h *Handler) UpdateStatus(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}
	membershipID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid membership id.")
	}
	var req struct {
		Status string `json:"status"`
		Reason string `json:"reason"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}
	item, err := h.service.UpdateStatus(c.Context(), membershipID, principal.UserID, req.Status, req.Reason)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Membership status updated.", item))
}

func (h *Handler) UpdateMembership(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}
	if !hasRole(principal.Roles, "super_admin") {
		return apperr.Forbidden("Manual level changes require super admin.")
	}

	membershipID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid membership id.")
	}

	var req struct {
		LevelID string `json:"levelId"`
		Reason  string `json:"reason"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}
	levelID, err := uuid.Parse(strings.TrimSpace(req.LevelID))
	if err != nil {
		return apperr.Validation("Invalid level id.", response.FieldError{Field: "levelId", Message: "must be a UUID"})
	}

	item, err := h.service.ManualLevelChange(c.Context(), membershipID, levelID, principal.UserID, req.Reason)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Membership level updated.", item))
}

func (h *Handler) ListLevels(c fiber.Ctx) error {
	items, err := h.service.ListAdminLevels(c.Context())
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", items))
}

func (h *Handler) UpdateLevel(c fiber.Ctx) error {
	levelID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid membership level id.")
	}

	var req struct {
		QualificationRules *QualificationRules `json:"qualificationRules"`
		Description        *string             `json:"description"`
		IsActive           *bool               `json:"isActive"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}
	if req.QualificationRules == nil {
		return apperr.Validation("Qualification rules are required.", response.FieldError{
			Field:   "qualificationRules",
			Message: "is required",
		})
	}

	item, err := h.service.UpdateLevel(c.Context(), levelID, *req.QualificationRules, req.Description, req.IsActive)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Membership level updated.", item))
}

func hasRole(roles []string, target string) bool {
	for _, role := range roles {
		if role == target {
			return true
		}
	}
	return false
}
