package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/denisenkom/go-mssqldb" // Driver SQL Server
	"github.com/go-resty/resty/v2"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
)

// =====================================================
// CONFIGURACIÓN
// =====================================================

type Config struct {
	LegacyConnString string
	BlendAPIURL      string
	BlendAPIToken    string // Token de autenticación para la API
	TiendaID         string
	PollingInterval  time.Duration
	BatchSize        int
}

func loadConfig() *Config {
	// Cargar .env si existe
	_ = godotenv.Load()

	return &Config{
		LegacyConnString: getEnv("LEGACY_CONN_STRING", "server=localhost;user id=sa;password=Password123!;port=1433;database=LinceIndumentaria"),
		BlendAPIURL:      getEnv("BLEND_API_URL", "http://localhost:8000/api/v1"),
		BlendAPIToken:    getEnv("BLEND_API_TOKEN", ""), // Se obtiene haciendo login
		TiendaID:         getEnv("TIENDA_ID", ""),       // UUID de la tienda en Blend
		PollingInterval:  getDurationEnv("POLLING_INTERVAL", 5*time.Second),
		BatchSize:        getIntEnv("BATCH_SIZE", 100),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if d, err := time.ParseDuration(value); err == nil {
			return d
		}
	}
	return defaultValue
}

func getIntEnv(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		var i int
		if _, err := fmt.Sscanf(value, "%d", &i); err == nil {
			return i
		}
	}
	return defaultValue
}

// =====================================================
// MODELOS
// =====================================================

// LegacyStock representa un registro de la tabla STK_SALDOS
type LegacyStock struct {
	ID              int       `db:"ID"`
	Codigo          string    `db:"CODIGO"`
	Talle           *string   `db:"TALLE"` // Nullable
	Color           *string   `db:"COLOR"` // Nullable
	Cantidad        float64   `db:"CANTIDAD"`
	Sucursal        string    `db:"SUCURSAL"`
	FechaMovimiento time.Time `db:"FECHA_ULTIMO_MOVIMIENTO"`
	Usuario         *string   `db:"USUARIO_MODIFICACION"` // Nullable
}

// LegacyProduct representa un registro de STK_PRODUCTOS
type LegacyProduct struct {
	Codigo      string  `db:"CODIGO"`
	Descripcion string  `db:"DESCRIPCION"`
	Rubro       *string `db:"RUBRO"`
	Precio      float64 `db:"PRECIO"`
	Costo       *float64 `db:"COSTO"`
	Marca       *string `db:"MARCA"`
	Proveedor   *string `db:"PROVEEDOR"`
}

// SyncPayload representa el payload que se envía a Blend API
type SyncPayload struct {
	SKULegacy       string   `json:"sku_legacy"`
	Descripcion     string   `json:"descripcion"`
	Talle           *string  `json:"talle"`
	Color           *string  `json:"color"`
	StockReal       float64  `json:"stock_real"`
	Ubicacion       string   `json:"ubicacion"`
	Precio          float64  `json:"precio"`
	Costo           *float64 `json:"costo"`
	Source          string   `json:"source"`
	FechaMovimiento string   `json:"fecha_movimiento"`
}

// =====================================================
// LEGACY AGENT
// =====================================================

type LegacyAgent struct {
	config     *Config
	legacyDB   *sqlx.DB
	httpClient *resty.Client
	lastCheck  time.Time
}

func NewLegacyAgent(config *Config) (*LegacyAgent, error) {
	// Conectar a SQL Server
	db, err := sqlx.Connect("sqlserver", config.LegacyConnString)
	if err != nil {
		return nil, fmt.Errorf("error conectando a SQL Server: %w", err)
	}

	// Test de conexión
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error en ping a SQL Server: %w", err)
	}

	// Cliente HTTP
	client := resty.New()
	client.SetTimeout(10 * time.Second)
	client.SetHeader("Content-Type", "application/json")
	
	// Si hay token, configurarlo
	if config.BlendAPIToken != "" {
		client.SetAuthToken(config.BlendAPIToken)
	}

	return &LegacyAgent{
		config:     config,
		legacyDB:   db,
		httpClient: client,
		lastCheck:  time.Now().Add(-24 * time.Hour), // Empezar desde ayer
	}, nil
}

func (a *LegacyAgent) Close() error {
	if a.legacyDB != nil {
		return a.legacyDB.Close()
	}
	return nil
}

func (a *LegacyAgent) Start(ctx context.Context) {
	log.Println("🕵️ LEGACY AGENT iniciado")
	log.Printf("📡 Conectado a: %s", maskConnectionString(a.config.LegacyConnString))
	log.Printf("🎯 Blend API: %s", a.config.BlendAPIURL)
	log.Printf("⏱️  Polling interval: %v", a.config.PollingInterval)
	log.Println("👀 Iniciando vigilancia...")

	ticker := time.NewTicker(a.config.PollingInterval)
	defer ticker.Stop()

	// Primer escaneo inmediato
	a.scanChanges(ctx)

	// Loop de polling
	for {
		select {
		case <-ctx.Done():
			log.Println("🛑 Agent detenido por contexto")
			return
		case <-ticker.C:
			a.scanChanges(ctx)
		}
	}
}

func (a *LegacyAgent) scanChanges(ctx context.Context) {
	log.Printf("🔍 Escaneando cambios desde %s...", a.lastCheck.Format("15:04:05"))

	// LA QUERY MÁGICA: WITH (NOLOCK)
	// Lee solo lo que cambió desde la última vez sin bloquear la tabla
	query := `
		SELECT 
			s.ID,
			s.CODIGO,
			s.TALLE,
			s.COLOR,
			s.CANTIDAD,
			s.SUCURSAL,
			s.FECHA_ULTIMO_MOVIMIENTO,
			s.USUARIO_MODIFICACION
		FROM STK_SALDOS s WITH (NOLOCK)
		WHERE s.FECHA_ULTIMO_MOVIMIENTO > @p1
		ORDER BY s.FECHA_ULTIMO_MOVIMIENTO ASC
	`

	var items []LegacyStock
	err := a.legacyDB.SelectContext(ctx, &items, query, a.lastCheck)
	if err != nil {
		log.Printf("⚠️ Error leyendo legacy DB: %v", err)
		return
	}

	if len(items) == 0 {
		log.Println("   ✅ No hay cambios")
		return
	}

	log.Printf("🚨 DETECTADOS %d CAMBIOS DE STOCK", len(items))

	// Procesar cambios
	successCount := 0
	errorCount := 0

	for _, item := range items {
		if err := a.syncItem(ctx, &item); err != nil {
			log.Printf("   ❌ Error sync: %s | %v", item.Codigo, err)
			errorCount++
		} else {
			log.Printf("   ✅ Sincronizado: %s | %s %s | Stock: %.2f",
				item.Codigo,
				stringOrNull(item.Color),
				stringOrNull(item.Talle),
				item.Cantidad)
			successCount++
		}

		// Actualizar watermark
		if item.FechaMovimiento.After(a.lastCheck) {
			a.lastCheck = item.FechaMovimiento
		}
	}

	log.Printf("📊 Resultado: %d exitosos, %d errores", successCount, errorCount)
}

func (a *LegacyAgent) syncItem(ctx context.Context, item *LegacyStock) error {
	// 1. Obtener info del producto
	product, err := a.getProductInfo(ctx, item.Codigo)
	if err != nil {
		return fmt.Errorf("error obteniendo producto: %w", err)
	}

	// 2. Armar payload para Blend API
	payload := SyncPayload{
		SKULegacy:       item.Codigo,
		Descripcion:     product.Descripcion,
		Talle:           item.Talle,
		Color:           item.Color,
		StockReal:       item.Cantidad,
		Ubicacion:       item.Sucursal,
		Precio:          product.Precio,
		Costo:           product.Costo,
		Source:          "LEGACY_AGENT",
		FechaMovimiento: item.FechaMovimiento.Format(time.RFC3339),
	}

	// 3. Enviar a Blend API
	endpoint := fmt.Sprintf("%s/sync/legacy", a.config.BlendAPIURL)
	
	resp, err := a.httpClient.R().
		SetBody(payload).
		Post(endpoint)

	if err != nil {
		return fmt.Errorf("error HTTP: %w", err)
	}

	if resp.StatusCode() >= 400 {
		return fmt.Errorf("error API: %d - %s", resp.StatusCode(), resp.String())
	}

	return nil
}

func (a *LegacyAgent) getProductInfo(ctx context.Context, codigo string) (*LegacyProduct, error) {
	query := `
		SELECT 
			CODIGO, DESCRIPCION, RUBRO, PRECIO, COSTO, MARCA, PROVEEDOR
		FROM STK_PRODUCTOS WITH (NOLOCK)
		WHERE CODIGO = @p1
	`

	var product LegacyProduct
	err := a.legacyDB.GetContext(ctx, &product, query, codigo)
	if err != nil {
		return nil, err
	}

	return &product, nil
}

// =====================================================
// HELPERS
// =====================================================

func maskConnectionString(connStr string) string {
	// Ocultar la password en los logs
	// Simplificado para el ejemplo
	return "sqlserver://***:***@localhost:1433/LinceIndumentaria"
}

func stringOrNull(s *string) string {
	if s == nil {
		return "NULL"
	}
	return *s
}

// =====================================================
// MAIN
// =====================================================

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	config := loadConfig()

	// Validar configuración
	if config.TiendaID == "" {
		log.Fatal("❌ TIENDA_ID no configurado. Set TIENDA_ID en .env")
	}

	// Crear agent
	agent, err := NewLegacyAgent(config)
	if err != nil {
		log.Fatalf("❌ Error creando agent: %v", err)
	}
	defer agent.Close()

	// Contexto con cancelación
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Iniciar agent
	agent.Start(ctx)
}
