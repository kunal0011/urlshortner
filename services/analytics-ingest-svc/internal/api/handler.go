package api

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/kunal/urlshortner/services/analytics-ingest-svc/internal/config"
	"github.com/kunal/urlshortner/services/analytics-ingest-svc/internal/kafka"
)

// ClickEvent is the event published to Kafka on each redirect.
type ClickEvent struct {
	EventID   string `json:"event_id"`
	ShortCode string `json:"short_code"`
	IP        string `json:"ip"`
	UserAgent string `json:"user_agent"`
	Referrer  string `json:"referrer"`
	Timestamp string `json:"timestamp"`
}

// Handler handles click event ingestion.
type Handler struct {
	producer *kafka.Producer
	cfg      *config.Config
}

// NewHandler constructs a Handler.
func NewHandler(p *kafka.Producer, cfg *config.Config) *Handler {
	return &Handler{producer: p, cfg: cfg}
}

// IngestClick handles POST /events/click.
// It validates the payload and publishes to Kafka asynchronously.
func (h *Handler) IngestClick(c *fiber.Ctx) error {
	var payload ClickEvent
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}
	if payload.ShortCode == "" {
		return fiber.NewError(fiber.StatusUnprocessableEntity, "short_code is required")
	}

	// Enrich with server-side fields
	payload.EventID = uuid.New().String()
	if payload.Timestamp == "" {
		payload.Timestamp = time.Now().UTC().Format(time.RFC3339Nano)
	}
	// Use short_code as Kafka partition key for ordering
	go func() {
		_ = h.producer.Publish(c.Context(), payload.ShortCode, payload)
	}()

	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{"status": "accepted"})
}
