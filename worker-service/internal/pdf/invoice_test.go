package pdf

import (
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestGenerateInvoicePDF(t *testing.T) {
	// Datos de prueba
	data := FacturaData{
		TiendaNombre:    "Carnicería La Vaca Loca",
		TiendaCUIT:      "20-12345678-9",
		TiendaDireccion: "Av. Siempre Viva 742, Springfield",
		TiendaTelefono:  "+54 11 4567-8900",
		
		VentaID:    uuid.New(),
		Fecha:      time.Now(),
		Total:      15850.50,
		MetodoPago: "Efectivo",
		
		AFIPCAE:         "75039517284561",
		AFIPCAEVto:      time.Now().Add(10 * 24 * time.Hour),
		TipoComprobante: "FACTURA B",
		PuntoVenta:      1,
		NumeroFactura:   125,
		
		Items: []FacturaItem{
			{
				Nombre:         "Bife de Chorizo (kg)",
				Cantidad:       2.5,
				PrecioUnitario: 4500.00,
				Subtotal:       11250.00,
			},
			{
				Nombre:         "Vacío (kg)",
				Cantidad:       1.8,
				PrecioUnitario: 3800.00,
				Subtotal:       6840.00,
			},
			{
				Nombre:         "Chorizo Parrillero (unidad)",
				Cantidad:       6,
				PrecioUnitario: 450.00,
				Subtotal:       2700.00,
			},
		},
	}
	
	// Generar PDF
	pdfBytes, err := GenerateInvoicePDF(data)
	if err != nil {
		t.Fatalf("Error generating PDF: %v", err)
	}
	
	// Verificar que se generó contenido
	if len(pdfBytes) == 0 {
		t.Fatal("Generated PDF is empty")
	}
	
	// Guardar PDF de ejemplo (opcional, para inspección manual)
	err = os.WriteFile("test_factura.pdf", pdfBytes, 0644)
	if err != nil {
		t.Logf("Warning: Could not save test PDF: %v", err)
	} else {
		t.Log("✅ PDF generado exitosamente: test_factura.pdf")
	}
}

func TestGenerateAFIPQRString(t *testing.T){
	data := FacturaData{
		TiendaCUIT:      "20-12345678-9",
		Fecha:           time.Date(2025, 11, 23, 15, 30, 0, 0, time.UTC),
		PuntoVenta:      1,
		TipoComprobante: "FACTURA B",
		NumeroFactura:   125,
		Total:           15850.50,
		AFIPCAE:         "75039517284561",
	}
	
	qrString := GenerateAFIPQRString(data)
	
	// Verificar que contiene los elementos esperados
	if qrString == "" {
		t.Fatal("QR string is empty")
	}
	
	t.Logf("QR String generado: %s", qrString)
	
	// Verificar que contiene datos clave
	requiredParts := []string{"cuit=", "ptoVta=", "nroCmp=", "codAut="}
	for _, part := range requiredParts {
		if !contains(qrString, part) {
			t.Errorf("QR string missing required part: %s", part)
		}
	}
}

func contains(str, substr string) bool {
	return len(str) >= len(substr) && (str == substr || len(str) > len(substr) && (str[:len(substr)] == substr || contains(str[1:], substr)))
}
