package loyalty

import (
	"strconv"
	"strings"
	"time"

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

func (h *Handler) ListPublicRewards(c fiber.Ctx) error {
	items, err := h.service.ListPublicRewards(c.Context())
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", items))
}

func (h *Handler) GetCustomerAccount(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}
	item, err := h.service.GetCustomerAccount(c.Context(), principal.UserID)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", item))
}

func (h *Handler) GetCustomerHistory(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	items, total, err := h.service.ListCustomerHistory(c.Context(), principal.UserID, page, limit)
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

func (h *Handler) GetCustomerRewards(c fiber.Ctx) error {
	items, err := h.service.ListCustomerRewards(c.Context())
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", items))
}

func (h *Handler) Redeem(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}
	var req struct {
		RewardID string `json:"rewardId"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}
	rewardID, err := uuid.Parse(strings.TrimSpace(req.RewardID))
	if err != nil {
		return apperr.Validation("Invalid reward id.", response.FieldError{Field: "rewardId", Message: "must be a UUID"})
	}
	item, err := h.service.Redeem(c.Context(), principal.UserID, rewardID)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusCreated, response.OK("Reward redeemed.", item))
}

func (h *Handler) ListAdminAccounts(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	items, total, err := h.service.ListAdminAccounts(c.Context(), page, limit)
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

func (h *Handler) ListAdminHistory(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	var userID *uuid.UUID
	if raw := strings.TrimSpace(c.Query("userId")); raw != "" {
		parsed, err := uuid.Parse(raw)
		if err != nil {
			return apperr.Validation("Invalid user id.", response.FieldError{Field: "userId", Message: "must be a UUID"})
		}
		userID = &parsed
	}
	items, total, err := h.service.ListAdminHistory(c.Context(), userID, page, limit)
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

func (h *Handler) Adjust(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}
	var req struct {
		UserID string `json:"userId"`
		Points int32  `json:"points"`
		Reason string `json:"reason"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}
	userID, err := uuid.Parse(strings.TrimSpace(req.UserID))
	if err != nil {
		return apperr.Validation("Invalid user id.", response.FieldError{Field: "userId", Message: "must be a UUID"})
	}
	item, err := h.service.Adjust(c.Context(), AdjustInput{
		UserID: userID,
		Points: req.Points,
		Reason: req.Reason,
		Actor:  principal.UserID,
	})
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Loyalty balance adjusted.", item))
}

func (h *Handler) ListCampaigns(c fiber.Ctx) error {
	items, err := h.service.ListCampaigns(c.Context())
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", items))
}

func (h *Handler) CreateCampaign(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}
	input, err := bindCampaign(c)
	if err != nil {
		return err
	}
	item, err := h.service.CreateCampaign(c.Context(), principal.UserID, input)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusCreated, response.OK("Campaign created.", item))
}

func (h *Handler) UpdateCampaign(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}
	campaignID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid campaign id.")
	}
	input, err := bindCampaign(c)
	if err != nil {
		return err
	}
	item, err := h.service.UpdateCampaign(c.Context(), campaignID, principal.UserID, input)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Campaign updated.", item))
}

func bindCampaign(c fiber.Ctx) (CampaignInput, error) {
	var req struct {
		Code               string   `json:"code"`
		Name               string   `json:"name"`
		Description        string   `json:"description"`
		StartsAt           string   `json:"startsAt"`
		EndsAt             string   `json:"endsAt"`
		PointMultiplier    float64  `json:"pointMultiplier"`
		BonusPoints        int32    `json:"bonusPoints"`
		EligibleLevelCodes []string `json:"eligibleLevelCodes"`
		IsActive           *bool    `json:"isActive"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return CampaignInput{}, apperr.BadRequest("Invalid JSON body.")
	}
	startsAt, err := time.Parse(time.RFC3339, strings.TrimSpace(req.StartsAt))
	if err != nil {
		return CampaignInput{}, apperr.Validation("Invalid startsAt.", response.FieldError{Field: "startsAt", Message: "must be RFC3339"})
	}
	endsAt, err := time.Parse(time.RFC3339, strings.TrimSpace(req.EndsAt))
	if err != nil {
		return CampaignInput{}, apperr.Validation("Invalid endsAt.", response.FieldError{Field: "endsAt", Message: "must be RFC3339"})
	}
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	if req.EligibleLevelCodes == nil {
		req.EligibleLevelCodes = []string{}
	}
	return CampaignInput{
		Code:               req.Code,
		Name:               req.Name,
		Description:        req.Description,
		StartsAt:           startsAt,
		EndsAt:             endsAt,
		PointMultiplier:    req.PointMultiplier,
		BonusPoints:        req.BonusPoints,
		EligibleLevelCodes: req.EligibleLevelCodes,
		IsActive:           isActive,
	}, nil
}
