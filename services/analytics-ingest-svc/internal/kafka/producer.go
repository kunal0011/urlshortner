package kafka

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/kunal/urlshortner/services/analytics-ingest-svc/internal/config"
	segkafka "github.com/segmentio/kafka-go"
)

// Producer wraps the kafka-go writer.
type Producer struct {
	writer *segkafka.Writer
	topic  string
}

// NewProducer creates a Kafka producer connected to the configured brokers.
func NewProducer(cfg *config.Config) (*Producer, error) {
	brokers := strings.Split(cfg.KafkaBrokers, ",")
	w := &segkafka.Writer{
		Addr:                   segkafka.TCP(brokers...),
		Topic:                  cfg.KafkaTopic,
		Balancer:               &segkafka.LeastBytes{},
		AllowAutoTopicCreation: true,
	}
	return &Producer{writer: w, topic: cfg.KafkaTopic}, nil
}

// Publish encodes a value as JSON and writes it to Kafka with the given key.
func (p *Producer) Publish(ctx context.Context, key string, value interface{}) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return p.writer.WriteMessages(ctx, segkafka.Message{
		Key:   []byte(key),
		Value: data,
	})
}

// Close shuts down the Kafka writer gracefully.
func (p *Producer) Close() error {
	return p.writer.Close()
}
