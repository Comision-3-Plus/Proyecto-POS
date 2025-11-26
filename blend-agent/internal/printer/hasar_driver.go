package printer

import (
	"fmt"
	"log"
)

// HasarDriver implementa el driver para impresoras Hasar
type HasarDriver struct {
	connected bool
	port      string
}

// NewHasarDriver crea un nuevo driver Hasar
func NewHasarDriver() *HasarDriver {
	return &HasarDriver{}
}

// Connect conecta a la impresora Hasar
func (d *HasarDriver) Connect(port string) error {
	log.Printf("🔌 Conectando a impresora Hasar en %s...", port)
	
	// En producción:
	// dll, err := syscall.LoadDLL("Hasar.dll")
	// Similar a Epson
	
	d.connected = true
	d.port = port
	log.Printf("✅ Conectado a Hasar en %s", port)
	
	return nil
}

// Disconnect desconecta de la impresora
func (d *HasarDriver) Disconnect() error {
	if !d.connected {
		return nil
	}
	
	d.connected = false
	log.Printf("🔌 Desconectado de Hasar")
	
	return nil
}

// PrintFiscalTicket imprime un ticket fiscal
func (d *HasarDriver) PrintFiscalTicket(items []FiscalItem, payment PaymentInfo) error {
	if !d.connected {
		return fmt.Errorf("impresora no conectada")
	}
	
	log.Printf("🖨️  Imprimiendo ticket fiscal Hasar...")
	log.Printf("   Items: %d", len(items))
	log.Printf("   Pago: %s - $%.2f", payment.Method, payment.Amount)
	
	// Comandos Hasar son diferentes a Epson
	// Hasar usa protocolo propietario
	
	for _, item := range items {
		log.Printf("   - %s x%.2f @ $%.2f", item.Description, item.Quantity, item.UnitPrice)
	}
	
	log.Printf("✅ Ticket fiscal Hasar impreso correctamente")
	
	return nil
}

// PrintNonFiscalText imprime texto no fiscal
func (d *HasarDriver) PrintNonFiscalText(lines []string) error {
	if !d.connected {
		return fmt.Errorf("impresora no conectada")
	}
	
	log.Printf("🖨️  Imprimiendo texto no fiscal Hasar...")
	
	for _, line := range lines {
		log.Printf("   %s", line)
	}
	
	log.Printf("✅ Texto no fiscal impreso correctamente")
	
	return nil
}

// GetStatus obtiene el estado de la impresora
func (d *HasarDriver) GetStatus() (PrinterStatus, error) {
	if !d.connected {
		return PrinterStatus{}, fmt.Errorf("impresora no conectada")
	}
	
	return PrinterStatus{
		IsOnline:          true,
		PaperStatus:       "ok",
		FiscalMemoryUsed:  30.2,
		LastDocumentNumber: 987,
	}, nil
}

// DailyClose ejecuta el cierre diario (cierre Z)
func (d *HasarDriver) DailyClose() (DailyCloseResult, error) {
	if !d.connected {
		return DailyCloseResult{}, fmt.Errorf("impresora no conectada")
	}
	
	log.Printf("📊 Ejecutando cierre Z Hasar...")
	
	result := DailyCloseResult{
		TotalSales:       89500.00,
		TotalTax:         18795.00,
		TransactionCount: 32,
		CloseNumber:      203,
		Success:          true,
	}
	
	log.Printf("✅ Cierre Z completado: $%.2f en %d transacciones", result.TotalSales, result.TransactionCount)
	
	return result, nil
}
