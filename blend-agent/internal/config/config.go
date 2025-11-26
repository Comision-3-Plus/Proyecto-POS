package config

import (
	"log"
	"os"
	"strconv"
)

// Config contiene la configuración del agente
type Config struct {
	Host         string
	Port         int
	PrinterType  string // "epson" o "hasar"
	PrinterPort  string // Puerto COM (ej: COM1)
	LogLevel     string
	EnableTLS    bool
}

// Load carga la configuración desde variables de entorno
func Load() *Config {
	cfg := &Config{
		Host:        getEnv("BLEND_HOST", "127.0.0.1"),
		Port:        getEnvInt("BLEND_PORT", 8080),
		PrinterType: getEnv("PRINTER_TYPE", "epson"),
		PrinterPort: getEnv("PRINTER_PORT", "COM1"),
		LogLevel:    getEnv("LOG_LEVEL", "INFO"),
		EnableTLS:   getEnvBool("ENABLE_TLS", false),
	}

	log.Printf("📝 Configuración cargada:")
	log.Printf("   - Host: %s:%d", cfg.Host, cfg.Port)
	log.Printf("   - Impresora: %s en %s", cfg.PrinterType, cfg.PrinterPort)
	log.Printf("   - Log Level: %s", cfg.LogLevel)

	return cfg
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}
