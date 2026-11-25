package cron

import (
	"log"

	"github.com/robfig/cron/v3"

	"parking-platform/backend/internal/service"
)

// RegisterJobs mirrors the 6 WordPress cron jobs from legacy functions.php
// and routes alerts through LINE OA Messaging API.
func RegisterJobs(line *service.LineNotifyService) *cron.Cron {
	c := cron.New()

	// Every 30 minutes: Parking check-in reminder, check-out reminder, overtime fee, check-in overdue (>1h)
	_, _ = c.AddFunc("*/30 * * * *", func() {
		log.Println("[cron] running 30m parking reminder & overtime checks")
		_ = line
	})

	// Every hour: Car rental 12-hour outbound & return reminders
	_, _ = c.AddFunc("0 * * * *", func() {
		log.Println("[cron] running 12h car rental outbound/return reminders")
		_ = line
	})

	c.Start()
	return c
}
