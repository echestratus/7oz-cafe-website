package health

import (
	"net/http"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Live(c fiber.Ctx) error {
	return response.JSON(c, http.StatusOK, response.OK("OK", h.service.Live()))
}

func (h *Handler) Ready(c fiber.Ctx) error {
	report := h.service.Ready(c.Context())
	status := http.StatusOK
	if report.Status != "healthy" {
		status = http.StatusServiceUnavailable
	}

	return response.JSON(c, status, response.OK("OK", report))
}
