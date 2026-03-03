package store

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kunal/urlshortner/services/redirect-svc/internal/domain"
)

// PostgresStore is a PostgreSQL-backed store for URL lookups.
type PostgresStore struct {
	pool *pgxpool.Pool
}

// NewPostgresStore creates a new PostgresStore.
func NewPostgresStore(pool *pgxpool.Pool) *PostgresStore {
	return &PostgresStore{pool: pool}
}

// GetByCode fetches a link from Postgres by its short code.
// Returns nil, nil if not found.
func (s *PostgresStore) GetByCode(ctx context.Context, code string) (*domain.URL, error) {
	const q = `
		SELECT id, short_code, long_url, org_id, created_by_id,
		       custom_alias, password_hash, expires_at, status,
		       created_at, updated_at
		FROM links
		WHERE short_code = $1
		  AND status = 'active'
		LIMIT 1`

	row := s.pool.QueryRow(ctx, q, code)

	var u domain.URL
	err := row.Scan(
		&u.ID, &u.ShortCode, &u.LongURL, &u.OrgID, &u.CreatedByID,
		&u.CustomAlias, &u.PasswordHash, &u.ExpiresAt, &u.Status,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		// pgx returns pgx.ErrNoRows which is not nil
		return nil, nil
	}
	return &u, nil
}

// IncrementClickCount atomically increments the click counter for a link.
func (s *PostgresStore) IncrementClickCount(ctx context.Context, shortCode string) error {
	const q = `UPDATE links SET click_count = click_count + 1 WHERE short_code = $1`
	_, err := s.pool.Exec(ctx, q, shortCode)
	return err
}
