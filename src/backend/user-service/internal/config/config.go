// Configuration for user-service
package config

import (
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string
	RedisAddr   string
	JWTSecret   string
	SMSProvider string
	SMSKey      string
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/tongxingzhe"),
		RedisAddr:  getEnv("REDIS_ADDR", "localhost:6379"),
		JWTSecret:  getEnv("JWT_SECRET", "tongxingzhe-secret-key-change-in-production"),
		SMSProvider: getEnv("SMS_PROVIDER", "aliyun"),
		SMSKey:      getEnv("SMS_KEY", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}