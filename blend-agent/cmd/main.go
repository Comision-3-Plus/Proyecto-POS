package main

import (
	"blend-agent/internal/config"
	"blend-agent/internal/handlers"
	"blend-agent/internal/printer"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/gorilla/mux"
)

func main() {
	// Banner
	printBanner()

	// Cargar configuración
	cfg := config.Load()

	// Inicializar manager de impresoras
	printerManager := printer.NewManager(cfg)
	defer printerManager.Close()

	// Detectar impresoras conectadas
	printers, err := printerManager.DetectPrinters()
	if err != nil {
		log.Printf("⚠️  Error detectando impresoras: %v", err)
	} else {
		log.Printf("✅ Impresoras detectadas: %d", len(printers))
		for _, p := range printers {
			log.Printf("   - %s (Puerto: %s, Tipo: %s)", p.Name, p.Port, p.Type)
		}
	}

	// Setup HTTP router
	router := mux.NewRouter()

	// Health check
	router.HandleFunc("/health", handlers.HealthCheck).Methods("GET")

	// Printer endpoints
	router.HandleFunc("/api/printers", handlers.ListPrinters(printerManager)).Methods("GET")
	router.HandleFunc("/api/print/fiscal", handlers.PrintFiscalTicket(printerManager)).Methods("POST")
	router.HandleFunc("/api/print/non-fiscal", handlers.PrintNonFiscalTicket(printerManager)).Methods("POST")
	router.HandleFunc("/api/printer/status", handlers.GetPrinterStatus(printerManager)).Methods("GET")
	router.HandleFunc("/api/printer/daily-close", handlers.DailyClose(printerManager)).Methods("POST")

	// CORS middleware
	router.Use(corsMiddleware)

	// Logging middleware
	router.Use(loggingMiddleware)

	// Start server
	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	log.Printf("🚀 Blend Agent listening on http://%s", addr)
	log.Printf("📄 Documentación: http://%s/health", addr)

	// Graceful shutdown
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := http.ListenAndServe(addr, router); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Error iniciando servidor: %v", err)
		}
	}()

	<-done
	log.Println("🛑 Cerrando Blend Agent...")
}

func printBanner() {
	banner := `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ██████╗ ██╗     ███████╗███╗   ██╗██████╗                ║
║   ██╔══██╗██║     ██╔════╝████╗  ██║██╔══██╗               ║
║   ██████╔╝██║     █████╗  ██╔██╗ ██║██║  ██║               ║
║   ██╔══██╗██║     ██╔══╝  ██║╚██╗██║██║  ██║               ║
║   ██████╔╝███████╗███████╗██║ ╚████║██████╔╝               ║
║   ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═══╝╚═════╝                ║
║                                                              ║
║                    HARDWARE BRIDGE                           ║
║              Nexus POS - Fiscal Printer Agent                ║
║                       v1.0.0                                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`
	fmt.Println(banner)
}

// corsMiddleware permite CORS desde frontend
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// loggingMiddleware registra todas las requests
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("📥 %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
		next.ServeHTTP(w, r)
	})
}
