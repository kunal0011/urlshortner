package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"
	"github.com/joho/godotenv"
	"github.com/kunal/urlshortner/services/analytics-ingest-svc/internal/api"
	"github.com/kunal/urlshortner/services/analytics-ingest-svc/internal/config"
	"github.com/kunal/urlshortner/services/analytics-ingest-svc/internal/kafka"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	producer, err := kafka.NewProducer(cfg)
	if err != nil {
		log.Fatalf("kafka producer init error: %v", err)
	}
	defer producer.Close()

	handler := api.NewHandler(producer, cfg)

	app := fiber.New(fiber.Config{
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	})
	app.Use(recover.New())
	app.Use(requestid.New())
	app.Use(logger.New())

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "analytics-ingest-svc"})
	})
	app.Post("/events/click", handler.IngestClick)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("analytics-ingest-svc listening on :%s", cfg.Port)
		if err := app.Listen(fmt.Sprintf(":%s", cfg.Port)); err != nil {
			log.Printf("server error: %v", err)
		}
	}()

	<-quit
	log.Println("shutting down analytics-ingest-svc...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = ctx
	if err := app.ShutdownWithTimeout(10 * time.Second); err != nil {
		log.Printf("shutdown error: %v", err)
	}
}
