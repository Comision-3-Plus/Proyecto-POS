package main

import (
	"fmt"
	"log"
	"time"

	"stock-in-order/worker/internal/email"
	"stock-in-order/worker/internal/invoices"
)

// Ejemplo de cómo usar las nuevas features de PDF y Email

func main() {
	fmt.Println("🎨 DEMO: Generación de PDF y Envío de Emails")
	fmt.Println("=" * 60)

	// ==================== 1. GENERAR PDF ====================
	fmt.Println("\n📄 1. Generando factura PDF...")
	
	generator := invoices.NewPDFGenerator("")
	
	pdfData := invoices.VentaPDFData{
		VentaID:    "VTA-2024-001234",
		Fecha:      time.Now(),
		MetodoPago: "Efectivo",

		ClienteNombre: "Juan Pérez",
		ClienteEmail:  "juan.perez@email.com",

		TiendaNombre: "BLEND Fashion Store",
		TiendaDirecc: "Av. Corrientes 1234, CABA",
		TiendaTelef:  "+54 11 1234-5678",
		TiendaCUIT:   "20-12345678-9",

		Items: []invoices.VentaItem{
			{
				ProductoNombre: "Remera Nike Deportiva",
				Cantidad:       2,
				PrecioUnitario: 15000,
				Subtotal:       30000,
			},
			{
				ProductoNombre: "Pantalón Adidas Classic",
				Cantidad:       1,
				PrecioUnitario: 25000,
				Subtotal:       25000,
			},
		},

		Subtotal: 55000,
		IVA:      11550,
		Total:    66550,

		QRData: "https://blend.com.ar/verify/VTA-2024-001234",
	}

	pdfBytes, err := generator.GenerateInvoice(pdfData)
	if err != nil {
		log.Fatalf("Error generando PDF: %v", err)
	}

	fmt.Printf("   ✅ PDF generado: %d bytes\n", len(pdfBytes))
	// Aquí puedes guardar el PDF: os.WriteFile("factura.pdf", pdfBytes, 0644)

	// ==================== 2. EMAIL DE BIENVENIDA ====================
	fmt.Println("\n📧 2. Preparando email de bienvenida...")
	
	emailClient := email.NewClient("", "noreply@blend.com.ar", "BLEND")
	
	err = emailClient.SendWelcomeEmail(
		"usuario@ejemplo.com",
		"Juan Pérez",
		"https://blend.com.ar/dashboard",
	)
	if err != nil {
		log.Printf("Error enviando email de bienvenida: %v", err)
	} else {
		fmt.Println("   ✅ Email de bienvenida enviado (modo dev)")
	}

	// ==================== 3. EMAIL DE TICKET ====================
	fmt.Println("\n🎫 3. Preparando email de comprobante...")
	
	ticketData := email.TicketEmailData{
		VentaID:       "VTA-2024-001234",
		Fecha:         "24/11/2024 15:30",
		ClienteNombre: "Juan Pérez",
		TiendaNombre:  "BLEND Fashion Store",
		MetodoPago:    "Efectivo",
		Items: []email.TicketItem{
			{
				ProductoNombre: "Remera Nike Deportiva",
				Cantidad:       "2",
				PrecioUnitario: "$15,000",
				Subtotal:       "$30,000",
			},
			{
				ProductoNombre: "Pantalón Adidas Classic",
				Cantidad:       "1",
				PrecioUnitario: "$25,000",
				Subtotal:       "$25,000",
			},
		},
		Subtotal:       "$55,000",
		IVA:            "$11,550",
		Total:          "$66,550",
		ComprobanteURL: "https://blend.com.ar/comprobantes/VTA-2024-001234.pdf",
	}

	err = emailClient.SendTicketEmail("cliente@ejemplo.com", ticketData)
	if err != nil {
		log.Printf("Error enviando ticket: %v", err)
	} else {
		fmt.Println("   ✅ Email de ticket enviado (modo dev)")
	}

	// ==================== 4. EMAIL DE ALERTA ====================
	fmt.Println("\n⚠️  4. Preparando email de alerta de stock...")
	
	alertData := email.AlertEmailData{
		Titulo:  "Stock Crítico - Remera Nike M",
		Mensaje: "El stock del producto está por debajo del mínimo configurado y requiere atención inmediata.",
		Details: []email.AlertDetail{
			{Label: "Producto", Value: "Remera Nike Deportiva Talle M"},
			{Label: "Stock Actual", Value: "2 unidades", Class: "critical"},
			{Label: "Stock Mínimo", Value: "5 unidades"},
			{Label: "Última Venta", Value: "Hace 2 horas"},
		},
		Recomendaciones: []string{
			"Realizar pedido urgente al proveedor",
			"Verificar ventas recientes del producto",
			"Considerar ajuste de precio si hay sobredemanda",
			"Revisar otros productos de la misma categoría",
		},
		ActionURL:  "https://blend.com.ar/inventario?producto=REM-NIK-M-001",
		ActionText: "Ver en Inventario",
	}

	err = emailClient.SendAlertEmail("admin@blend.com.ar", "stock_critico", alertData)
	if err != nil {
		log.Printf("Error enviando alerta: %v", err)
	} else {
		fmt.Println("   ✅ Email de alerta enviado (modo dev)")
	}

	// ==================== RESUMEN ====================
	fmt.Println("\n" + "="*60)
	fmt.Println("✅ DEMO COMPLETADO!")
	fmt.Println("="*60)
	fmt.Println("\n📝 Notas:")
	fmt.Println("   • Los emails se simulan en modo desarrollo (sin API key)")
	fmt.Println("   • Para enviar emails reales, configura SENDGRID_API_KEY")
	fmt.Println("   • El PDF se puede guardar con os.WriteFile()")
	fmt.Println("   • Templates HTML están en worker-service/templates/")
}
