package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/kunal/urlshortner/services/redirect-svc/internal/cache"
	"github.com/kunal/urlshortner/services/redirect-svc/internal/config"
	"github.com/kunal/urlshortner/services/redirect-svc/internal/store"
	"golang.org/x/sync/singleflight"
)

// RedirectHandler handles short-code redirect requests.
type RedirectHandler struct {
	cache *cache.RedisCache
	store *store.PostgresStore
	cfg   *config.Config
	group singleflight.Group
}

// NewRedirectHandler creates a RedirectHandler with injected dependencies.
func NewRedirectHandler(c *cache.RedisCache, s *store.PostgresStore, cfg *config.Config) *RedirectHandler {
	return &RedirectHandler{cache: c, store: s, cfg: cfg}
}

// Redirect is the core hot-path handler. Flow:
//  1. Check Redis cache
//  2. On miss: fetch from Postgres (deduplicated via singleflight)
//  3. Backfill cache
//  4. Async: fire click event to analytics-ingest-svc
//  5. Issue 301/302 redirect
func (h *RedirectHandler) Redirect(c *fiber.Ctx) error {
	code := c.Params("code")
	if code == "" {
		return fiber.ErrBadRequest
	}

	ctx := context.Background()

	// 1. Try cache
	u, err := h.cache.Get(ctx, code)
	if err != nil {
		// Cache error is non-fatal — fall through to DB
		_ = err
	}

	// 2. Cache miss — fetch from Postgres, deduplicated
	if u == nil {
		type result struct {
			longURL string
		}
		v, err, _ := h.group.Do(code, func() (interface{}, error) {
			url, err := h.store.GetByCode(ctx, code)
			if err != nil || url == nil {
				return nil, err
			}
			// 3. Backfill cache
			_ = h.cache.Set(ctx, url)
			return &result{longURL: url.LongURL}, nil
		})
		if err != nil {
			return fiber.ErrInternalServerError
		}
		if v == nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "short URL not found",
			})
		}
		r := v.(*result)
		// 4. Fire click event asynchronously
		go h.emitClickEvent(code, c)
		// 5. Redirect
		return c.Redirect(r.longURL, fiber.StatusMovedPermanently)
	}

	// Check expiry
	if u.IsExpired() {
		return c.Status(fiber.StatusGone).JSON(fiber.Map{"error": "link has expired"})
	}

	// Check password protection
	if u.IsProtected() {
		// In production you'd serve a password entry page; return 401 here
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "password required"})
	}

	// 4. Fire click event asynchronously
	go h.emitClickEvent(code, c)

	// 5. Redirect
	statusCode := fiber.StatusMovedPermanently
	if h.cfg.Environment != "prod" {
		statusCode = fiber.StatusFound
	}
	return c.Redirect(u.LongURL, statusCode)
}

// clickEventPayload mirrors the analytics ingest event schema.
type clickEventPayload struct {
	ShortCode string `json:"short_code"`
	IP        string `json:"ip"`
	UserAgent string `json:"user_agent"`
	Referrer  string `json:"referrer"`
	Timestamp string `json:"timestamp"`
}

func (h *RedirectHandler) emitClickEvent(code string, c *fiber.Ctx) {
	payload := clickEventPayload{
		ShortCode: code,
		IP:        c.IP(),
		UserAgent: c.Get("User-Agent"),
		Referrer:  c.Get("Referer"),
		Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
	}
	data, _ := json.Marshal(payload)
	url := fmt.Sprintf("%s/events/click", h.cfg.AnalyticsIngestURL)
	ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer cancel()
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(data))
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err == nil {
		_ = resp.Body.Close()
	}
}

// ErrorHandler is a custom Fiber error handler that returns JSON error responses.
func ErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{
		"error":  err.Error(),
		"status": code,
	})
}
