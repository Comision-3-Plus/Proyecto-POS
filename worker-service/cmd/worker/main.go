package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"worker-service/internal/config"
	"worker-service/internal/processors"
	"worker-service/internal/rabbitmq"
)

func main() {
	// Banner
	printBanner()

	// Cargar configuración
	cfg := config.LoadConfig()

	log.Printf("🔧 Configuración cargada:")
	log.Printf("   🐰 RabbitMQ: %s", cfg.RabbitMQURL)
	log.Printf("   📦 Queue: %s", cfg.QueueName)
	log.Printf("   🛍️ Shopify: %s", cfg.ShopifyURL)
	log.Printf("   🛒 MercadoLibre: %s", cfg.MeLiURL)
	log.Printf("   🆔 Worker ID: %s", cfg.WorkerID)

	// Crear handler (por ahora solo Shopify, pero podríamos tener múltiples)
	handler := processors.ShopifySyncHandler(
		cfg.ShopifyURL,
		cfg.ShopifyToken,
		cfg.ShopifyTimeout,
	)

	// Crear consumer de RabbitMQ
	consumer, err := rabbitmq.NewConsumer(
		cfg.RabbitMQURL,
		cfg.QueueName,
		handler,
		cfg.PrefetchCount,
	)
	if err != nil {
		log.Fatalf("❌ Error creando consumer: %v", err)
	}

	// Iniciar consumo
	err = consumer.Start()
	if err != nil {
		log.Fatalf("❌ Error iniciando consumer: %v", err)
	}

	log.Println("✅ Worker iniciado correctamente")
	log.Println("👀 Presiona Ctrl+C para detener...")

	// Esperar señal de terminación
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("\n🛑 Recibida señal de terminación. Cerrando gracefully...")

	// Cerrar consumer
	consumer.Close()

	log.Println("👋 Worker detenido. Hasta luego!")
}

func printBanner() {
	banner := `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🔥 BLEND POS - SHOPIFY/MELI SYNC WORKER 🔥                 ║
║                                                               ║
║   Módulo 4: Event-Driven Architecture                        ║
║   Escucha eventos de venta y sincroniza con marketplaces     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`
	log.Println(banner)
}
