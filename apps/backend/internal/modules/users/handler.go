package users

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

func (h *Handler) List(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	items, total, err := h.service.ListStaff(
		c.Context(),
		c.Query("status"),
		c.Query("role"),
		c.Query("search"),
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

func (h *Handler) Get(c fiber.Ctx) error {
	userID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid user id.")
	}
	item, err := h.service.GetStaff(c.Context(), userID)
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", item))
}

func (h *Handler) Create(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	var req struct {
		Email    string `json:"email"`
		FullName string `json:"fullName"`
		Password string `json:"password"`
		RoleCode string `json:"roleCode"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}

	item, err := h.service.CreateStaff(c.Context(), CreateStaffInput{
		Email:    req.Email,
		FullName: req.FullName,
		Password: req.Password,
		RoleCode: req.RoleCode,
		ActorID:  principal.UserID,
	})
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusCreated, response.OK("Staff user created.", item))
}

func (h *Handler) UpdateStatus(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}
	userID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid user id.")
	}

	var req struct {
		Status string `json:"status"`
		Reason string `json:"reason"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}

	item, err := h.service.UpdateStatus(c.Context(), UpdateStatusInput{
		UserID:  userID,
		ActorID: principal.UserID,
		Status:  strings.TrimSpace(req.Status),
		Reason:  req.Reason,
	})
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Staff status updated.", item))
}

func (h *Handler) UpdateRole(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}
	userID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return apperr.BadRequest("Invalid user id.")
	}

	var req struct {
		RoleCode string `json:"roleCode"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}

	item, err := h.service.UpdateRole(c.Context(), UpdateRoleInput{
		UserID:   userID,
		ActorID:  principal.UserID,
		RoleCode: req.RoleCode,
	})
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("Staff role updated.", item))
}

func (h *Handler) ListRoles(c fiber.Ctx) error {
	items, err := h.service.ListAssignableRoles(c.Context())
	if err != nil {
		return err
	}
	return response.JSON(c, fiber.StatusOK, response.OK("OK", items))
}
