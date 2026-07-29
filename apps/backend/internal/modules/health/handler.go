package health

import (
	"time"

	"github.com/echestratus/7oz-cafe-website/apps/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
)

type StatusPayload struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Timestamp string `json:"timestamp"`
}

type Handler struct {
	serviceName string
}

func NewHandler(serviceName string) *Handler {
	return &Handler{serviceName: serviceName}
}

func (h *Handler) Check(c fiber.Ctx) error {
	payload := StatusPayload{
		Status:    "healthy",
		Service:   h.serviceName,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	return c.JSON(response.OK("OK", payload))
}
