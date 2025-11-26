package processors

import (
	"encoding/json"
	"fmt"
	"log"
	"time"
)

// MercadoLibreProcessor procesa eventos de venta para MercadoLibre
type MercadoLibreProcessor struct {
	meliURL   string
	meliToken string
	timeout   time.Duration
}

// NewMercadoLibreProcessor crea un nuevo procesador de MercadoLibre
func NewMercadoLibreProcessor(meliURL, meliToken string, timeout time.Duration) *MercadoLibreProcessor {
	return &MercadoLibreProcessor{
		meliURL:   meliURL,
		meliToken: meliToken,
		timeout:   timeout,
	}
}

// Process procesa un mensaje de venta
func (p *MercadoLibreProcessor) Process(body []byte) error {
	var event SaleEvent
	err := json.Unmarshal(body, &event)
	if err != nil {
		return fmt.Errorf("error parseando JSON: %w", err)
	}

	log.Printf("🛒 [MERCADOLIBRE] Procesando venta:")
	log.Printf("   📍 Tienda: %s", event.TiendaID)
	log.Printf("   💰 Total: $%.2f", event.Total)
	log.Printf("   💳 Método: %s", event.MetodoPago)
	log.Printf("   📦 Items: %d", len(event.Items))

	// Procesar cada item de la venta
	for _, item := range event.Items {
		err := p.updateInventory(item)
		if err != nil {
			return fmt.Errorf("error actualizando item %s: %w", item.ProductoSKU, err)
		}
	}

	log.Printf("✨ [MERCADOLIBRE] Venta sincronizada exitosamente")
	return nil
}

// updateInventory actualiza el inventario en MercadoLibre para un item
func (p *MercadoLibreProcessor) updateInventory(item SaleItem) error {
	log.Printf("   🔄 Actualizando SKU: %s | Descontando: %.2f unidades", item.ProductoSKU, item.Cantidad)

	// SIMULACIÓN DE LATENCIA DE RED
	time.Sleep(150 * time.Millisecond)

	// =================================================================
	// 🚀 AQUÍ IRÍA LA LLAMADA REAL A MERCADOLIBRE API
	// =================================================================
	/*
	   PUT https://api.mercadolibre.com/items/{ITEM_ID}
	   {
	     "available_quantity": {cantidad_nueva}
	   }
	*/

	// MOCK: Simulamos que la llamada fue exitosa
	log.Printf("   ✅ Stock actualizado en MercadoLibre para SKU: %s", item.ProductoSKU)

	return nil
}

// MeLiSyncHandler es el handler compatible con RabbitMQ consumer
func MeLiSyncHandler(meliURL, meliToken string, timeout time.Duration) func([]byte) error {
	processor := NewMercadoLibreProcessor(meliURL, meliToken, timeout)
	
	return func(body []byte) error {
		return processor.Process(body)
	}
}
