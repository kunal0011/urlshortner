package domain

import "time"

// LinkStatus represents the state of a shortened URL.
type LinkStatus string

const (
	LinkStatusActive   LinkStatus = "active"
	LinkStatusExpired  LinkStatus = "expired"
	LinkStatusDisabled LinkStatus = "disabled"
)

// URL is the core domain entity for a shortened link.
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
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// IsExpired returns true if the link has a TTL that has passed.
func (u *URL) IsExpired() bool {
	if u.ExpiresAt == nil {
		return false
	}
	return time.Now().After(*u.ExpiresAt)
}

// IsProtected returns true if the link requires a password.
func (u *URL) IsProtected() bool {
	return u.PasswordHash != nil && *u.PasswordHash != ""
}
