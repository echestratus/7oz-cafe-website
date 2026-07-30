package contact

import (
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/apperr"
	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
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
