-- ─────────────────────────────────────────────────────────────────────────────
-- URL Shortener – ClickHouse Analytics Schema
-- Version: 1.0.0
-- Engine: ReplicatedMergeTree (use MergeTree for local dev with docker-compose)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS analytics;

-- ─────────────────────────────────────────────────────────────────────────────
-- CLICKS — raw click events from the analytics ingest pipeline
-- Partitioned monthly, primary key optimised for per-short-code queries.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics.clicks
(
    event_id      UUID            DEFAULT generateUUIDv4(),
    short_code    LowCardinality(String),
    org_id        LowCardinality(String)  DEFAULT '',

    -- Timing
    clicked_at    DateTime,

    -- Geo
    country       LowCardinality(String)  DEFAULT 'unknown',
    region        LowCardinality(String)  DEFAULT 'unknown',
    city          String                  DEFAULT 'unknown',

    -- Device
    device_type   LowCardinality(String)  DEFAULT 'unknown',   -- mobile | desktop | tablet | bot
    browser       LowCardinality(String)  DEFAULT 'unknown',
    os            LowCardinality(String)  DEFAULT 'unknown',

    -- Traffic source
    referrer      String                  DEFAULT '',
    referrer_domain LowCardinality(String) DEFAULT '',
    utm_source    LowCardinality(String)  DEFAULT '',
    utm_medium    LowCardinality(String)  DEFAULT '',
    utm_campaign  LowCardinality(String)  DEFAULT '',

    -- Privacy-preserving identifier (SHA-256 of IP, not raw IP)
    ip_hash       FixedString(64)         DEFAULT '',

    -- Ingestion metadata
    ingest_at     DateTime    DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(clicked_at)
ORDER BY (short_code, clicked_at)
TTL clicked_at + INTERVAL 2 YEAR DELETE
SETTINGS index_granularity = 8192;

-- ─────────────────────────────────────────────────────────────────────────────
-- CLICKS_HOURLY — pre-aggregated hourly summary (materialised view)
-- Used by analytics-query-svc for fast timeseries queries.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics.clicks_hourly
(
    short_code    LowCardinality(String),
    org_id        LowCardinality(String),
    hour          DateTime,
    total_clicks  UInt64,
    unique_ips    UInt64
)
ENGINE = SummingMergeTree((total_clicks, unique_ips))
PARTITION BY toYYYYMM(hour)
ORDER BY (short_code, hour);

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.clicks_hourly_mv
TO analytics.clicks_hourly
AS
SELECT
    short_code,
    org_id,
    toStartOfHour(clicked_at)  AS hour,
    count()                    AS total_clicks,
    uniq(ip_hash)              AS unique_ips
FROM analytics.clicks
GROUP BY short_code, org_id, hour;

-- ─────────────────────────────────────────────────────────────────────────────
-- CLICKS_COUNTRY — pre-aggregated country breakdown (materialised view)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics.clicks_country
(
    short_code    LowCardinality(String),
    country       LowCardinality(String),
    day           Date,
    total_clicks  UInt64
)
ENGINE = SummingMergeTree(total_clicks)
PARTITION BY toYYYYMM(day)
ORDER BY (short_code, country, day);

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.clicks_country_mv
TO analytics.clicks_country
AS
SELECT
    short_code,
    country,
    toDate(clicked_at)  AS day,
    count()             AS total_clicks
FROM analytics.clicks
GROUP BY short_code, country, day;
