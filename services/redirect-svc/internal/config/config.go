package config

import "os"

// Config holds all runtime configuration for redirect-svc.
type Config struct {
	Port          string
	DatabaseURL   string
	RedisHost     string
	RedisPort     string
	RedisPassword string
	BaseShortURL  string
	Environment   string
	LogLevel      string

	// Analytics ingest sidecar endpoint
	AnalyticsIngestURL string
}

// Load reads configuration from environment variables.
func Load() *Config {
	return &Config{
		Port:               getEnv("REDIRECT_SVC_PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/urlshortner"),
		RedisHost:          getEnv("REDIS_HOST", "localhost"),
		RedisPort:          getEnv("REDIS_PORT", "6379"),
		RedisPassword:      getEnv("REDIS_PASSWORD", ""),
		BaseShortURL:       getEnv("BASE_SHORT_URL", "http://localhost:8080"),
		Environment:        getEnv("ENVIRONMENT", "dev"),
		LogLevel:           getEnv("LOG_LEVEL", "info"),
		AnalyticsIngestURL: getEnv("ANALYTICS_INGEST_URL", "http://localhost:8082"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
