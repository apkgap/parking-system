package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"parking-platform/backend/internal/config"
	"parking-platform/backend/internal/cron"
	"parking-platform/backend/internal/db"
	"parking-platform/backend/internal/handler"
	"parking-platform/backend/internal/service"
)

func main() {
	cfg := config.Load()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer pool.Close()

	lineSvc := service.NewLineNotifyService(cfg.LineChannelAccessToken, cfg.LineStaffGroupID)
	twoC2PSvc := service.NewTwoC2PService(
		cfg.TwoC2PEnv,
		cfg.TwoC2PMerchantID,
		cfg.TwoC2PSecretKey,
		cfg.TwoC2PReturnURL,
		cfg.TwoC2PWebhookURL,
	)

	scheduler := cron.RegisterJobs(lineSvc)
	defer scheduler.Stop()

	app := fiber.New(fiber.Config{
		AppName: "Parking Platform API",
	})
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AppBaseURL,
		AllowCredentials: true,
	}))

	srv := &handler.Server{
		Cfg:    cfg,
		Pool:   pool,
		TwoC2P: twoC2PSvc,
		Line:   lineSvc,
	}
	srv.RegisterRoutes(app)

	go func() {
		log.Printf("Parking API listening on :%s", cfg.AppPort)
		if err := app.Listen(":" + cfg.AppPort); err != nil {
			log.Printf("server stopped: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("shutting down gracefully...")
	_ = app.ShutdownWithTimeout(10 * time.Second)
}
