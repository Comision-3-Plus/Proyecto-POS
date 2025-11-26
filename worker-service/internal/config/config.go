package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config contiene toda la configuración del worker
type Config struct {
	// RabbitMQ
	RabbitMQURL      string
	QueueName        string
	PrefetchCount    int
	ReconnectDelay   time.Duration
	
	// Shopify
	ShopifyURL       string
	ShopifyToken     string
	ShopifyTimeout   time.Duration
	
	// MercadoLibre
	MeLiURL          string
	MeLiToken        string
	MeLiTimeout      time.Duration
	
	// Worker
	WorkerID         string
	MaxRetries       int
	
	// Legacy (para compatibilidad)
	DB_DSN          string
	SendGrid_APIKey string
	EncryptionKey   string
}

// LoadConfig carga la configuración desde variables de entorno
func LoadConfig() *Config {
	return &Config{
		// RabbitMQ
		RabbitMQURL:    getEnv("RABBITMQ_URL", "amqp://user:pass@localhost:5672/"),
		QueueName:      getEnv("QUEUE_NAME", "queue.sales.created"),
		PrefetchCount:  getEnvAsInt("PREFETCH_COUNT", 1),
		ReconnectDelay: 5 * time.Second,
		
		// Shopify
		ShopifyURL:     getEnv("SHOPIFY_URL", "https://blend-pos.myshopify.com"),
		ShopifyToken:   getEnv("SHOPIFY_TOKEN", "mock-token-for-testing"),
		ShopifyTimeout: 10 * time.Second,
		
		// MercadoLibre
		MeLiURL:        getEnv("MELI_URL", "https://api.mercadolibre.com"),
		MeLiToken:      getEnv("MELI_TOKEN", "mock-token-for-testing"),
		MeLiTimeout:    10 * time.Second,
		
		// Worker
		WorkerID:       getEnv("WORKER_ID", "shopify-worker-1"),
		MaxRetries:     getEnvAsInt("MAX_RETRIES", 3),
		
		// Legacy
		DB_DSN:          getEnv("DB_DSN", "postgres://user:pass@localhost:5432/stock_db?sslmode=disable"),
		SendGrid_APIKey: getEnv("SENDGRID_API_KEY", ""),
		EncryptionKey:   getEnv("ENCRYPTION_KEY", "12345678901234567890123456789012"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
		fmt.Printf("⚠️ Warning: Invalid integer for %s, using default: %d\n", key, defaultValue)
	}
	return defaultValue
}
