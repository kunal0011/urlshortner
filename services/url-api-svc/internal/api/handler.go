package api

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/kunal/urlshortner/services/url-api-svc/internal/config"
	"github.com/kunal/urlshortner/services/url-api-svc/internal/domain"
	"github.com/kunal/urlshortner/services/url-api-svc/internal/store"
	"github.com/redis/go-redis/v9"
)

// Handler holds service-level dependencies for the URL API.
type Handler struct {
	store *store.PostgresStore
	redis *redis.Client
	cfg   *config.Config
}

// NewHandler creates a Handler.
func NewHandler(s *store.PostgresStore, rdb *redis.Client, cfg *config.Config) *Handler {
	return &Handler{store: s, redis: rdb, cfg: cfg}
}

// RegisterRoutes mounts all URL API v1 routes.
func RegisterRoutes(r fiber.Router, h *Handler) {
	r.Post("/links", h.CreateLink)
	r.Get("/links", h.ListLinks)
	r.Delete("/links/:id", h.DeleteLink)
	r.Post("/links/bulk", h.BulkCreateLinks)
}

// CreateLink handles POST /api/v1/links.
func (h *Handler) CreateLink(c *fiber.Ctx) error {
	var req domain.CreateLinkRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	if req.LongURL == "" {
		return fiber.NewError(fiber.StatusUnprocessableEntity, "long_url is required")
	}

	// TODO: validate URL via Google Safe Browsing API when key is set
	// TODO: extract authenticated userID from JWT claims

	createdBy := "" // empty = nil UUID in store layer
	u, err := h.store.Create(c.Context(), &req, createdBy)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to create link")
	}

	// Invalidate any stale cache entry for this short code
	_ = h.redis.Del(c.Context(), "url:"+u.ShortCode)

	return c.Status(fiber.StatusCreated).JSON(domain.CreateLinkResponse{
		ID:        u.ID,
		ShortCode: u.ShortCode,
		ShortURL:  fmt.Sprintf("%s/%s", h.cfg.BaseShortURL, u.ShortCode),
		LongURL:   u.LongURL,
		ExpiresAt: u.ExpiresAt,
		CreatedAt: u.CreatedAt,
	})
}

// ListLinks handles GET /api/v1/links?org_id=x&page=1&page_size=20.
func (h *Handler) ListLinks(c *fiber.Ctx) error {
	orgID := c.Query("org_id", "")
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("page_size", 20)
	if pageSize > 100 {
		pageSize = 100
	}

	links, total, err := h.store.List(c.Context(), orgID, page, pageSize)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to list links")
	}

	return c.JSON(domain.ListLinksResponse{
		Links:    links,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

// DeleteLink handles DELETE /api/v1/links/:id.
func (h *Handler) DeleteLink(c *fiber.Ctx) error {
	id := c.Params("id")
	orgID := c.Query("org_id", "")

	if err := h.store.Delete(c.Context(), id, orgID); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to delete link")
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// BulkCreateLinks handles POST /api/v1/links/bulk — creates many links from a JSON array.
func (h *Handler) BulkCreateLinks(c *fiber.Ctx) error {
	var reqs []domain.CreateLinkRequest
	if err := c.BodyParser(&reqs); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	if len(reqs) == 0 {
		return fiber.NewError(fiber.StatusUnprocessableEntity, "at least one link is required")
	}
	if len(reqs) > 500 {
		return fiber.NewError(fiber.StatusUnprocessableEntity, "maximum 500 links per batch")
	}

	var results []domain.CreateLinkResponse
	createdBy := "anon"
	for _, req := range reqs {
		req := req
		u, err := h.store.Create(c.Context(), &req, createdBy)
		if err != nil {
			continue // skip failed rows, return partial success
		}
		results = append(results, domain.CreateLinkResponse{
			ID:        u.ID,
			ShortCode: u.ShortCode,
			ShortURL:  fmt.Sprintf("%s/%s", h.cfg.BaseShortURL, u.ShortCode),
			LongURL:   u.LongURL,
			ExpiresAt: u.ExpiresAt,
			CreatedAt: u.CreatedAt,
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"created": len(results),
		"links":   results,
	})
}

// ErrorHandler returns JSON-formatted error responses.
func ErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{"error": err.Error(), "status": code})
}
