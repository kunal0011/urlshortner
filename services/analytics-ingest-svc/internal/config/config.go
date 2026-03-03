package config

import "os"

type Config struct {
	Port         string
	KafkaBrokers string
	KafkaTopic   string
	Environment  string
	LogLevel     string
}

func Load() *Config {
	return &Config{
		Port:         getEnv("ANALYTICS_INGEST_SVC_PORT", "8082"),
		KafkaBrokers: getEnv("KAFKA_BROKERS", "localhost:9092"),
		KafkaTopic:   getEnv("KAFKA_TOPIC_CLICK_EVENTS", "click-events"),
		Environment:  getEnv("ENVIRONMENT", "dev"),
		LogLevel:     getEnv("LOG_LEVEL", "info"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
