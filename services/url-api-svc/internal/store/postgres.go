package store

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kunal/urlshortner/services/url-api-svc/internal/domain"
)

const shortCodeChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// PostgresStore handles link CRUD operations.
type PostgresStore struct {
	pool *pgxpool.Pool
}

func NewPostgresStore(pool *pgxpool.Pool) *PostgresStore {
	return &PostgresStore{pool: pool}
}

// Create inserts a new link and returns the created entity.
func (s *PostgresStore) Create(ctx context.Context, req *domain.CreateLinkRequest, createdBy string) (*domain.URL, error) {
	id := uuid.New().String()
	code := req.Alias
	if code == "" {
		code = generateShortCode(7)
	}

	// Handle nullable UUID columns — if empty, pass nil instead of empty string
	var orgID interface{}
	if req.OrgID != "" {
		orgID = req.OrgID
	}
	var createdByID interface{}
	if createdBy != "" {
		createdByID = createdBy
	}
	var alias interface{}
	if req.Alias != "" {
		alias = req.Alias
	}

	const q = `
		INSERT INTO links (id, short_code, long_url, org_id, created_by_id, custom_alias, password_hash, expires_at, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
		RETURNING id, short_code, long_url, org_id, created_by_id, custom_alias, password_hash, expires_at, status, created_at, updated_at`

	var u domain.URL
	err := s.pool.QueryRow(ctx, q,
		id, code, req.LongURL, orgID, createdByID, alias, "", req.ExpiresAt,
	).Scan(
		&u.ID, &u.ShortCode, &u.LongURL, &u.OrgID, &u.CreatedByID,
		&u.CustomAlias, &u.PasswordHash, &u.ExpiresAt, &u.Status,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create link: %w", err)
	}
	return &u, nil
}

// List returns links for an org with pagination.
func (s *PostgresStore) List(ctx context.Context, orgID string, page, pageSize int) ([]*domain.URL, int, error) {
	offset := (page - 1) * pageSize

	const countQ = `SELECT COUNT(*) FROM links WHERE org_id = $1 AND status = 'active'`
	var total int
	if err := s.pool.QueryRow(ctx, countQ, orgID).Scan(&total); err != nil {
		return nil, 0, err
	}

	const q = `
		SELECT id, short_code, long_url, org_id, created_by_id, custom_alias,
		       password_hash, expires_at, status, click_count, created_at, updated_at
		FROM links
		WHERE org_id = $1 AND status = 'active'
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := s.pool.Query(ctx, q, orgID, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var links []*domain.URL
	for rows.Next() {
		var u domain.URL
		if err := rows.Scan(
			&u.ID, &u.ShortCode, &u.LongURL, &u.OrgID, &u.CreatedByID,
			&u.CustomAlias, &u.PasswordHash, &u.ExpiresAt, &u.Status,
			&u.ClickCount, &u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		links = append(links, &u)
	}
	return links, total, nil
}

// Delete soft-deletes a link by setting status = 'disabled'.
func (s *PostgresStore) Delete(ctx context.Context, id, orgID string) error {
	const q = `UPDATE links SET status = 'disabled', updated_at = NOW() WHERE id = $1 AND org_id = $2`
	_, err := s.pool.Exec(ctx, q, id, orgID)
	return err
}

// generateShortCode produces a random alphanumeric code of the given length.
func generateShortCode(length int) string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	b := make([]byte, length)
	for i := range b {
		b[i] = shortCodeChars[r.Intn(len(shortCodeChars))]
	}
	return string(b)
}
