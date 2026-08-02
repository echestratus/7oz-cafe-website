package authentication

import (
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/authctx"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/config"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
)

type Handler struct {
	service *Service
	cfg     *config.Config
}

type registerRequest struct {
	FullName string `json:"fullName"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type tokenRequest struct {
	Token string `json:"token"`
}

type resetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"newPassword"`
}

type forgotPasswordRequest struct {
	Email string `json:"email"`
}

func NewHandler(service *Service, cfg *config.Config) *Handler {
	return &Handler{service: service, cfg: cfg}
}

func (h *Handler) Register(c fiber.Ctx) error {
	var req registerRequest
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}

	result, err := h.service.Register(c.Context(), RegisterInput{
		FullName: req.FullName,
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		return err
	}

	return response.JSON(c, fiber.StatusCreated, response.OK("Registration successful. Please verify your email.", result))
}

func (h *Handler) VerifyEmail(c fiber.Ctx) error {
	var req tokenRequest
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}

	user, err := h.service.VerifyEmail(c.Context(), req.Token)
	if err != nil {
		return err
	}

	return response.JSON(c, fiber.StatusOK, response.OK("Email verified successfully.", user))
}

func (h *Handler) Login(c fiber.Ctx) error {
	var req loginRequest
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}

	result, err := h.service.Login(c.Context(), LoginInput{
		Email:     req.Email,
		Password:  req.Password,
		UserAgent: c.Get("User-Agent"),
		IPAddress: c.IP(),
	})
	if err != nil {
		return err
	}

	h.setRefreshCookie(c, result.RefreshToken)
	return response.JSON(c, fiber.StatusOK, response.OK("Login successful.", result))
}

func (h *Handler) Refresh(c fiber.Ctx) error {
	raw := c.Cookies(RefreshCookieName())
	result, err := h.service.Refresh(c.Context(), raw, RequestMeta{
		UserAgent: c.Get("User-Agent"),
		IPAddress: c.IP(),
	})
	if err != nil {
		h.clearRefreshCookie(c)
		return err
	}

	h.setRefreshCookie(c, result.RefreshToken)
	return response.JSON(c, fiber.StatusOK, response.OK("Token refreshed.", result))
}

func (h *Handler) Logout(c fiber.Ctx) error {
	raw := c.Cookies(RefreshCookieName())
	if err := h.service.Logout(c.Context(), raw, RequestMeta{
		UserAgent: c.Get("User-Agent"),
		IPAddress: c.IP(),
	}); err != nil {
		return err
	}

	h.clearRefreshCookie(c)
	return response.JSON(c, fiber.StatusOK, response.OK("Logged out successfully.", map[string]any{}))
}

func (h *Handler) Me(c fiber.Ctx) error {
	principal, ok := authctx.PrincipalFromCtx(c)
	if !ok {
		return apperr.Unauthorized("Authentication required.")
	}

	user, err := h.service.Me(c.Context(), principal.UserID)
	if err != nil {
		return err
	}

	return response.JSON(c, fiber.StatusOK, response.OK("OK", user))
}

func (h *Handler) ForgotPassword(c fiber.Ctx) error {
	var req forgotPasswordRequest
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}

	resetToken, err := h.service.ForgotPassword(c.Context(), req.Email)
	if err != nil {
		return err
	}

	payload := map[string]any{
		"message": "If the email exists, a reset link will be sent.",
	}
	if resetToken != "" {
		payload["passwordResetToken"] = resetToken
	}

	return response.JSON(c, fiber.StatusOK, response.OK("Password reset accepted.", payload))
}

func (h *Handler) ResetPassword(c fiber.Ctx) error {
	var req resetPasswordRequest
	if err := c.Bind().Body(&req); err != nil {
		return apperr.BadRequest("Invalid JSON body.")
	}

	if err := h.service.ResetPassword(c.Context(), req.Token, req.NewPassword); err != nil {
		return err
	}

	return response.JSON(c, fiber.StatusOK, response.OK("Password reset successful.", map[string]any{}))
}

func (h *Handler) setRefreshCookie(c fiber.Ctx, raw string) {
	c.Cookie(&fiber.Cookie{
		Name:     RefreshCookieName(),
		Value:    raw,
		Path:     "/api/v1/auth",
		HTTPOnly: true,
		Secure:   !h.cfg.IsDevelopment(),
		SameSite: "Lax",
		MaxAge:   int(h.cfg.JWT.RefreshTTL.Seconds()),
		Expires:  time.Now().UTC().Add(h.cfg.JWT.RefreshTTL),
	})
}

func (h *Handler) clearRefreshCookie(c fiber.Ctx) {
	c.Cookie(&fiber.Cookie{
		Name:     RefreshCookieName(),
		Value:    "",
		Path:     "/api/v1/auth",
		HTTPOnly: true,
		Secure:   !h.cfg.IsDevelopment(),
		SameSite: "Lax",
		MaxAge:   -1,
		Expires:  time.Now().UTC().Add(-time.Hour),
	})
}
