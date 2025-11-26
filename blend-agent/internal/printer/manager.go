package printer

import (
	"blend-agent/internal/config"
	"fmt"
	"log"
	"sync"
)

// PrinterType representa el tipo de impresora
type PrinterType string

const (
	TypeEpson PrinterType = "epson"
	TypeHasar PrinterType = "hasar"
)

// PrinterInfo contiene información de la impresora
type PrinterInfo struct {
	Name   string      `json:"name"`
	Port   string      `json:"port"`
	Type   PrinterType `json:"type"`
	Status string      `json:"status"`
}

// Manager gestiona la comunicación con impresoras fiscales
type Manager struct {
	cfg      *config.Config
	printers map[string]*Printer
	mu       sync.RWMutex
}

// Printer representa una impresora fiscal
type Printer struct {
	Info     PrinterInfo
	driver   Driver
	isActive bool
}

// Driver es la interfaz para drivers de impresoras
type Driver interface {
	Connect(port string) error
	Disconnect() error
	PrintFiscalTicket(items []FiscalItem, payment PaymentInfo) error
	PrintNonFiscalText(lines []string) error
	GetStatus() (PrinterStatus, error)
	DailyClose() (DailyCloseResult, error)
}

// FiscalItem representa un item en un ticket fiscal
type FiscalItem struct {
	Description string  `json:"description"`
	Quantity    float64 `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	TaxRate     float64 `json:"tax_rate"` // 21%, 10.5%, etc.
}

// PaymentInfo contiene información del pago
type PaymentInfo struct {
	Method      string  `json:"method"`       // "efectivo", "tarjeta", "transferencia"
	Amount      float64 `json:"amount"`
	CardNetwork string  `json:"card_network"` // "visa", "mastercard", etc. (opcional)
	Installments int    `json:"installments"` // Cuotas (opcional)
}

// PrinterStatus contiene el estado de la impresora
type PrinterStatus struct {
	IsOnline          bool    `json:"is_online"`
	PaperStatus       string  `json:"paper_status"`        // "ok", "low", "empty"
	FiscalMemoryUsed  float64 `json:"fiscal_memory_used"`  // Porcentaje
	LastDocumentNumber int    `json:"last_document_number"`
	ErrorMessage      string  `json:"error_message,omitempty"`
}

// DailyCloseResult contiene el resultado del cierre Z
type DailyCloseResult struct {
	TotalSales       float64 `json:"total_sales"`
	TotalTax         float64 `json:"total_tax"`
	TransactionCount int     `json:"transaction_count"`
	CloseNumber      int     `json:"close_number"`
	Success          bool    `json:"success"`
	ErrorMessage     string  `json:"error_message,omitempty"`
}

// NewManager crea un nuevo manager de impresoras
func NewManager(cfg *config.Config) *Manager {
	return &Manager{
		cfg:      cfg,
		printers: make(map[string]*Printer),
	}
}

// DetectPrinters detecta impresoras conectadas
func (m *Manager) DetectPrinters() ([]PrinterInfo, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	var printers []PrinterInfo

	// Intentar conectar según configuración
	port := m.cfg.PrinterPort
	printerType := PrinterType(m.cfg.PrinterType)

	var driver Driver
	switch printerType {
	case TypeEpson:
		driver = NewEpsonDriver()
	case TypeHasar:
		driver = NewHasarDriver()
	default:
		return nil, fmt.Errorf("tipo de impresora no soportado: %s", printerType)
	}

	// Intentar conexión
	if err := driver.Connect(port); err != nil {
		log.Printf("⚠️  No se pudo conectar a %s en %s: %v", printerType, port, err)
		return printers, nil
	}

	printer := &Printer{
		Info: PrinterInfo{
			Name:   fmt.Sprintf("%s Fiscal Printer", printerType),
			Port:   port,
			Type:   printerType,
			Status: "connected",
		},
		driver:   driver,
		isActive: true,
	}

	m.printers[port] = printer
	printers = append(printers, printer.Info)

	return printers, nil
}

// GetPrinter obtiene una impresora por puerto
func (m *Manager) GetPrinter(port string) (*Printer, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	printer, exists := m.printers[port]
	if !exists {
		return nil, fmt.Errorf("impresora no encontrada en puerto: %s", port)
	}

	return printer, nil
}

// GetDefaultPrinter obtiene la impresora por defecto
func (m *Manager) GetDefaultPrinter() (*Printer, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Retornar la primera impresora activa
	for _, printer := range m.printers {
		if printer.isActive {
			return printer, nil
		}
	}

	return nil, fmt.Errorf("no hay impresoras disponibles")
}

// Close cierra todas las conexiones
func (m *Manager) Close() {
	m.mu.Lock()
	defer m.mu.Unlock()

	for _, printer := range m.printers {
		if printer.driver != nil {
			printer.driver.Disconnect()
		}
	}
}
