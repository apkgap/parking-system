package config

import (
	"os"
	"strconv"
)

type Config struct {
	AppEnv       string
	AppPort      string
	AppBaseURL   string
	DatabaseURL  string
	RedisURL     string
	JWTAccessSec string
	JWTRefreshSc string
	JWTAccessMin int
	JWTRefreshHr int

	TwoC2PEnv        string
	TwoC2PMerchantID string
	TwoC2PSecretKey  string
	TwoC2PReturnURL  string
	TwoC2PWebhookURL string

	LineChannelSecret      string
	LineChannelAccessToken string
	LineStaffGroupID       string

	AviationStackAPIKey string
}

func Load() Config {
	return Config{
		AppEnv:                 envOr("APP_ENV", "development"),
		AppPort:                envOr("APP_PORT", "8080"),
		AppBaseURL:             envOr("APP_BASE_URL", "http://localhost:3000"),
		DatabaseURL:            envOr("DATABASE_URL", "postgres://parking:parking_secret@localhost:5432/parking_system?sslmode=disable"),
		RedisURL:               envOr("REDIS_URL", "redis://localhost:6379/0"),
		JWTAccessSec:           envOr("JWT_ACCESS_SECRET", "dev-access-secret"),
		JWTRefreshSc:           envOr("JWT_REFRESH_SECRET", "dev-refresh-secret"),
		JWTAccessMin:           envInt("JWT_ACCESS_TTL_MIN", 15),
		JWTRefreshHr:           envInt("JWT_REFRESH_TTL_HOURS", 168),
		TwoC2PEnv:              envOr("TWOC2P_ENV", "sandbox"),
		TwoC2PMerchantID:       os.Getenv("TWOC2P_MERCHANT_ID"),
		TwoC2PSecretKey:        os.Getenv("TWOC2P_SECRET_KEY"),
		TwoC2PReturnURL:        envOr("TWOC2P_RETURN_URL", "http://localhost:3000/checkout/result"),
		TwoC2PWebhookURL:       envOr("TWOC2P_BACKEND_WEBHOOK_URL", "http://localhost:8080/api/v1/webhooks/2c2p"),
		LineChannelSecret:      os.Getenv("LINE_CHANNEL_SECRET"),
		LineChannelAccessToken: os.Getenv("LINE_CHANNEL_ACCESS_TOKEN"),
		LineStaffGroupID:       os.Getenv("LINE_STAFF_GROUP_ID"),
		AviationStackAPIKey:    os.Getenv("AVIATIONSTACK_API_KEY"),
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}
