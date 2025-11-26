package processors

import (
	"encoding/json"
	"fmt"
	"log"
	"time"
)

// SaleEvent representa el evento de venta recibido desde Python
type SaleEvent struct {
	TiendaID  string      `json:"tienda_id"`
	Total     float64     `json:"total"`
	MetodoPago string     `json:"metodo_pago"`
	Items     []SaleItem  `json:"items"`
	Timestamp string      `json:"timestamp"`
}

// SaleItem representa un item dentro de la venta
type SaleItem struct {
	ProductoID     string  `json:"producto_id"`
	ProductoNombre string  `json:"producto_nombre"`
	ProductoSKU    string  `json:"producto_sku"`
	Cantidad       float64 `json:"cantidad"`
	PrecioUnitario float64 `json:"precio_unitario"`
	Subtotal       float64 `json:"subtotal"`
}

// ShopifyProcessor procesa eventos de venta para Shopify
type ShopifyProcessor struct {
	shopifyURL   string
	shopifyToken string
	timeout      time.Duration
}

// NewShopifyProcessor crea un nuevo procesador de Shopify
func NewShopifyProcessor(shopifyURL, shopifyToken string, timeout time.Duration) *ShopifyProcessor {
	return &ShopifyProcessor{
		shopifyURL:   shopifyURL,
		shopifyToken: shopifyToken,
		timeout:      timeout,
	}
}

// Process procesa un mensaje de venta
func (p *ShopifyProcessor) Process(body []byte) error {
	var event SaleEvent
	err := json.Unmarshal(body, &event)
	if err != nil {
		return fmt.Errorf("error parseando JSON: %w", err)
	}

	log.Printf("🛍️ [SHOPIFY] Procesando venta:")
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

	log.Printf("✨ [SHOPIFY] Venta sincronizada exitosamente")
	return nil
}

// updateInventory actualiza el inventario en Shopify para un item
func (p *ShopifyProcessor) updateInventory(item SaleItem) error {
	log.Printf("   🔄 Actualizando SKU: %s | Descontando: %.2f unidades", item.ProductoSKU, item.Cantidad)

	// SIMULACIÓN DE LATENCIA DE RED (Shopify a veces es lento)
	time.Sleep(200 * time.Millisecond)

	// =================================================================
	// 🚀 AQUÍ IRÍA LA LLAMADA REAL A SHOPIFY GRAPHQL API
	// =================================================================
	/*
	   mutation {
	     inventoryAdjustQuantity(input: {
	       inventoryLevelId: "gid://shopify/InventoryLevel/...",
	       availableDelta: -2
	     }) {
	       inventoryLevel {
	         available
	       }
	     }
	   }
	*/

	// MOCK: Simulamos que la llamada fue exitosa
	log.Printf("   ✅ Stock actualizado en Shopify para SKU: %s", item.ProductoSKU)

	// Simulamos un error aleatorio (5% de probabilidad) para testing
	// if rand.Float32() < 0.05 {
	//     return fmt.Errorf("shopify API error: rate limit exceeded")
	// }

	return nil
}

// ShopifySyncHandler es el handler compatible con RabbitMQ consumer
func ShopifySyncHandler(shopifyURL, shopifyToken string, timeout time.Duration) func([]byte) error {
	processor := NewShopifyProcessor(shopifyURL, shopifyToken, timeout)
	
	return func(body []byte) error {
		return processor.Process(body)
	}
}
