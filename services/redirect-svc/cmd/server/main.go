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
	"github.com/kunal/urlshortner/services/redirect-svc/internal/api"
	"github.com/kunal/urlshortner/services/redirect-svc/internal/cache"
	"github.com/kunal/urlshortner/services/redirect-svc/internal/config"
	"github.com/kunal/urlshortner/services/redirect-svc/internal/store"
	"github.com/redis/go-redis/v9"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()

	// Redis client
	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort),
		Password: cfg.RedisPassword,
		DB:       0,
	})
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("redis connect error: %v", err)
	}

	// Postgres pool
	dbpool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("postgres connect error: %v", err)
	}
	defer dbpool.Close()

	// Wire dependencies
	urlCache := cache.NewRedisCache(rdb, 24*time.Hour)
	urlStore := store.NewPostgresStore(dbpool)
	handler := api.NewRedirectHandler(urlCache, urlStore, cfg)

	// Fiber app
	app := fiber.New(fiber.Config{
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		ErrorHandler: api.ErrorHandler,
	})

	app.Use(recover.New())
	app.Use(requestid.New())
	app.Use(logger.New(logger.Config{
		Format: "${time} | ${status} | ${latency} | ${method} ${path} | reqid=${locals:requestid}\n",
	}))

	// Routes
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "redirect-svc"})
	})
	app.Get("/:code", handler.Redirect)

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		port := cfg.Port
		if port == "" {
			port = "8080"
		}
		log.Printf("redirect-svc listening on :%s", port)
		if err := app.Listen(":" + port); err != nil {
			log.Printf("server error: %v", err)
		}
	}()

	<-quit
	log.Println("shutting down redirect-svc...")
	if err := app.ShutdownWithTimeout(10 * time.Second); err != nil {
		log.Printf("shutdown error: %v", err)
	}
	log.Println("redirect-svc stopped")
}
