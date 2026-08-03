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
		PointsPerCompletedReservation int32  `json:"pointsPerCompletedReservation"`
		ExpirationStrategy            string `json:"expirationStrategy"`
		ExpirationMonths              int32  `json:"expirationMonths"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}
	item, err := h.service.UpdateSettings(c.Context(), principal.UserID, SettingsInput{
		PointsPerCompletedReservation: req.PointsPerCompletedReservation,
		ExpirationStrategy:            req.ExpirationStrategy,
		ExpirationMonths:              req.ExpirationMonths,
	})
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Loyalty settings updated.", item))
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
	item, err := h.service.Redeem(c.Context(), principal.UserID, rewardID, principal.UserID)
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

func (h *Handler) LookupDeskCustomer(c fiber.Ctx) error {
	query := strings.TrimSpace(c.Query("q"))
	if query == "" {
		return apperr.Validation("Lookup query is required.", response.FieldError{Field: "q", Message: "is required"})
	}
	item, err := h.service.LookupDeskCustomer(c.Context(), query)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", item))
}

func (h *Handler) AdminRedeem(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}
	var req struct {
		RewardID         string  `json:"rewardId"`
		UserID           *string `json:"userId"`
		MembershipNumber string  `json:"membershipNumber"`
		Email            string  `json:"email"`
		QRPayload        string  `json:"qrPayload"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}
	rewardID, err := uuid.Parse(strings.TrimSpace(req.RewardID))
	if err != nil {
		return apperr.Validation("Invalid reward id.", response.FieldError{Field: "rewardId", Message: "must be a UUID"})
	}

	input := AdminRedeemInput{
		RewardID:         rewardID,
		MembershipNumber: req.MembershipNumber,
		Email:            req.Email,
		QRPayload:        req.QRPayload,
		ActorUserID:      principal.UserID,
	}
	if req.UserID != nil && strings.TrimSpace(*req.UserID) != "" {
		parsed, parseErr := uuid.Parse(strings.TrimSpace(*req.UserID))
		if parseErr != nil {
			return apperr.Validation("Invalid user id.", response.FieldError{Field: "userId", Message: "must be a UUID"})
		}
		input.UserID = &parsed
	}

	item, err := h.service.AdminRedeem(c.Context(), input)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusCreated, response.OK("Reward redeemed.", item))
}

func (h *Handler) ListCampaigns(c fiber.Ctx) error {
	items, err := h.service.ListCampaigns(c.Context())
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", items))
}

func (h *Handler) ListRewards(c fiber.Ctx) error {
	items, err := h.service.ListRewardsAdmin(c.Context())
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", items))
}

func (h *Handler) CreateReward(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}
	input, err := bindReward(c)
	if err != nil {
		return err
	}
	item, err := h.service.CreateReward(c.Context(), principal.UserID, input)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusCreated, response.OK("Reward created.", item))
}

func (h *Handler) UpdateReward(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}
	rewardID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid reward id.")
	}
	input, err := bindReward(c)
	if err != nil {
		return err
	}
	item, err := h.service.UpdateReward(c.Context(), rewardID, principal.UserID, input)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Reward updated.", item))
}

func (h *Handler) DeleteReward(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}
	rewardID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid reward id.")
	}
	if err := h.service.DeleteReward(c.Context(), rewardID, principal.UserID); err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Reward deleted.", map[string]any{}))
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

func bindReward(c fiber.Ctx) (RewardInput, error) {
	var req struct {
		Code        string         `json:"code"`
		Title       string         `json:"title"`
		Description string         `json:"description"`
		PointsCost  int32          `json:"pointsCost"`
		Stock       *int32         `json:"stock"`
		IsActive    *bool          `json:"isActive"`
		SortOrder   *int32         `json:"sortOrder"`
		Data        map[string]any `json:"data"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return RewardInput{}, apperr.BadRequest("Invalid JSON body.")
	}
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	var sortOrder int32
	if req.SortOrder != nil {
		sortOrder = *req.SortOrder
	}
	if req.Data == nil {
		req.Data = map[string]any{}
	}
	return RewardInput{
		Code:        req.Code,
		Title:       req.Title,
		Description: req.Description,
		PointsCost:  req.PointsCost,
		Stock:       req.Stock,
		IsActive:    isActive,
		SortOrder:   sortOrder,
		Data:        req.Data,
	}, nil
}
