-- ─────────────────────────────────────────────────────────────────────────────
-- URL Shortener – PostgreSQL Schema
-- Version: 1.0.0
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE link_status AS ENUM ('active', 'expired', 'disabled');
CREATE TYPE user_role   AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE plan_type   AS ENUM ('free', 'pro', 'enterprise');

-- ─────────────────────────────────────────────────────────────────────────────
-- ORGANIZATIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    plan        plan_type    NOT NULL DEFAULT 'free',
    owner_id    UUID,                           -- references users.id (set after user creation)
    max_links   INTEGER NOT NULL DEFAULT 100,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug     ON organizations(slug);
CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email          VARCHAR(320) UNIQUE NOT NULL,
    name           VARCHAR(255),
    password_hash  VARCHAR(255),
    org_id         UUID REFERENCES organizations(id) ON DELETE SET NULL,
    role           user_role NOT NULL DEFAULT 'member',
    keycloak_id    VARCHAR(255) UNIQUE,         -- external IdP reference
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email      ON users(email);
CREATE INDEX idx_users_org_id     ON users(org_id);
CREATE INDEX idx_users_keycloak_id ON users(keycloak_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- API KEYS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
    key_hash    VARCHAR(255) NOT NULL UNIQUE,   -- bcrypt hash of the raw API key
    name        VARCHAR(100),                   -- human-readable label
    scopes      TEXT[],                         -- e.g. {'links:read','links:write'}
    last_used   TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user_id  ON api_keys(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- LINKS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS links (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_code     VARCHAR(50)  UNIQUE NOT NULL,
    long_url       TEXT         NOT NULL,
    org_id         UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    custom_alias   VARCHAR(50),                 -- NULL if auto-generated
    password_hash  VARCHAR(255),               -- NULL if no password protection
    status         link_status  NOT NULL DEFAULT 'active',
    click_count    BIGINT       NOT NULL DEFAULT 0,
    expires_at     TIMESTAMPTZ,
    title          VARCHAR(500),               -- optional human-readable title
    utm_source     VARCHAR(255),
    utm_medium     VARCHAR(255),
    utm_campaign   VARCHAR(255),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_links_short_code  ON links(short_code);
CREATE INDEX idx_links_org_id            ON links(org_id);
CREATE INDEX idx_links_created_by_id     ON links(created_by_id);
CREATE INDEX idx_links_status            ON links(status);
CREATE INDEX idx_links_expires_at        ON links(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_links_created_at        ON links(created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- LINK TAGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS link_tags (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    tag     VARCHAR(100) NOT NULL,
    UNIQUE(link_id, tag)
);

CREATE INDEX idx_link_tags_link_id ON link_tags(link_id);
CREATE INDEX idx_link_tags_tag     ON link_tags(tag);

-- ─────────────────────────────────────────────────────────────────────────────
-- DOMAIN ALLOWLISTS (per org custom domains)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_domains (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    domain      VARCHAR(255) NOT NULL UNIQUE,
    verified    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_custom_domains_org_id ON custom_domains(org_id);
CREATE INDEX idx_custom_domains_domain ON custom_domains(domain);

-- ─────────────────────────────────────────────────────────────────────────────
-- AUTO-UPDATE updated_at via trigger
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_links_updated_at
    BEFORE UPDATE ON links
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
