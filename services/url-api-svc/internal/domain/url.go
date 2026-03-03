package domain

import "time"

type LinkStatus string

const (
	LinkStatusActive   LinkStatus = "active"
	LinkStatusExpired  LinkStatus = "expired"
	LinkStatusDisabled LinkStatus = "disabled"
)

// URL is the canonical link entity.
type URL struct {
	ID           string
	ShortCode    string
	LongURL      string
	OrgID        *string
	CreatedByID  *string
	CustomAlias  *string
	PasswordHash *string
	ExpiresAt    *time.Time
	Status       LinkStatus
	ClickCount   int64
	Tags         []string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// CreateLinkRequest represents the payload for creating a short link.
type CreateLinkRequest struct {
	LongURL   string     `json:"long_url"   validate:"required,url"`
	Alias     string     `json:"alias"`
	Password  string     `json:"password"`
	ExpiresAt *time.Time `json:"expires_at"`
	OrgID     string     `json:"org_id"`
	Tags      []string   `json:"tags"`
}

// CreateLinkResponse is returned after successful link creation.
type CreateLinkResponse struct {
	ID        string     `json:"id"`
	ShortCode string     `json:"short_code"`
	ShortURL  string     `json:"short_url"`
	LongURL   string     `json:"long_url"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

// ListLinksResponse wraps paginated link results.
type ListLinksResponse struct {
	Links    []*URL `json:"links"`
	Total    int    `json:"total"`
	Page     int    `json:"page"`
	PageSize int    `json:"page_size"`
}
