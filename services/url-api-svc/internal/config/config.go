package config

import "os"

type Config struct {
	Port               string
	DatabaseURL        string
	RedisHost          string
	RedisPort          string
	RedisPassword      string
	BaseShortURL       string
	JWTSecret          string
	KeycloakURL        string
	KeycloakRealm      string
	KeycloakClientID   string
	Environment        string
	LogLevel           string
	SafeBrowsingAPIKey string
}

func Load() *Config {
	return &Config{
		Port:               getEnv("URL_API_SVC_PORT", "8081"),
		DatabaseURL:        getEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/urlshortner"),
		RedisHost:          getEnv("REDIS_HOST", "localhost"),
		RedisPort:          getEnv("REDIS_PORT", "6379"),
		RedisPassword:      getEnv("REDIS_PASSWORD", ""),
		BaseShortURL:       getEnv("BASE_SHORT_URL", "http://localhost:8080"),
		JWTSecret:          getEnv("JWT_SECRET", ""),
		KeycloakURL:        getEnv("KEYCLOAK_URL", "http://localhost:8090"),
		KeycloakRealm:      getEnv("KEYCLOAK_REALM", "urlshortner"),
		KeycloakClientID:   getEnv("KEYCLOAK_CLIENT_ID", "url-api-svc"),
		Environment:        getEnv("ENVIRONMENT", "dev"),
		LogLevel:           getEnv("LOG_LEVEL", "info"),
		SafeBrowsingAPIKey: getEnv("GOOGLE_SAFE_BROWSING_API_KEY", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
