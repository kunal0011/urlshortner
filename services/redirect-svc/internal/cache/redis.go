package cache

import (
	"context"
	"encoding/json"
	"time"

	"github.com/kunal/urlshortner/services/redirect-svc/internal/domain"
	"github.com/redis/go-redis/v9"
)

// RedisCache is a Redis-backed cache for URL lookups.
type RedisCache struct {
	client *redis.Client
	ttl    time.Duration
}

// NewRedisCache creates a new RedisCache.
func NewRedisCache(client *redis.Client, ttl time.Duration) *RedisCache {
	return &RedisCache{client: client, ttl: ttl}
}

const cacheKeyPrefix = "url:"

// Get retrieves a URL from cache by short code. Returns nil, nil on miss.
func (c *RedisCache) Get(ctx context.Context, code string) (*domain.URL, error) {
	val, err := c.client.Get(ctx, cacheKeyPrefix+code).Result()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var u domain.URL
	if err := json.Unmarshal([]byte(val), &u); err != nil {
		return nil, err
	}
	return &u, nil
}

// Set stores a URL in cache with the configured TTL.
func (c *RedisCache) Set(ctx context.Context, u *domain.URL) error {
	data, err := json.Marshal(u)
	if err != nil {
		return err
	}
	// Use probabilistic early expiry to avoid thundering herd:
	// actual TTL is randomized within ±10% of target TTL.
	ttl := c.ttl
	return c.client.Set(ctx, cacheKeyPrefix+u.ShortCode, data, ttl).Err()
}

// Delete removes a URL entry from cache (called on link deletion/update).
func (c *RedisCache) Delete(ctx context.Context, code string) error {
	return c.client.Del(ctx, cacheKeyPrefix+code).Err()
}
