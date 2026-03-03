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
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/kunal/urlshortner/services/url-api-svc/internal/api"
	"github.com/kunal/urlshortner/services/url-api-svc/internal/config"
	"github.com/kunal/urlshortner/services/url-api-svc/internal/store"
	"github.com/redis/go-redis/v9"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort),
		Password: cfg.RedisPassword,
		DB:       0,
	})
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("redis connect error: %v", err)
	}

	dbpool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("postgres connect error: %v", err)
	}
	defer dbpool.Close()

	urlStore := store.NewPostgresStore(dbpool)
	handler := api.NewHandler(urlStore, rdb, cfg)

	app := fiber.New(fiber.Config{
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		ErrorHandler: api.ErrorHandler,
	})

	app.Use(recover.New())
	app.Use(requestid.New())
	app.Use(logger.New())

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "url-api-svc"})
	})

	v1 := app.Group("/api/v1")
	api.RegisterRoutes(v1, handler)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("url-api-svc listening on :%s", cfg.Port)
		if err := app.Listen(":" + cfg.Port); err != nil {
			log.Printf("server error: %v", err)
		}
	}()

	<-quit
	log.Println("shutting down url-api-svc...")
	if err := app.ShutdownWithTimeout(15 * time.Second); err != nil {
		log.Printf("shutdown error: %v", err)
	}
	log.Println("url-api-svc stopped")
}
