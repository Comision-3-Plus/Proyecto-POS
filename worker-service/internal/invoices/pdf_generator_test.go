package invoices

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPDFGenerator_GenerateInvoice(t *testing.T) {
	generator := NewPDFGenerator("")

	testData := VentaPDFData{
		VentaID:    "VTA-2024-001234",
		Fecha:      time.Now(),
		MetodoPago: "Efectivo",

		ClienteNombre: "Juan Pérez",
		ClienteEmail:  "juan.perez@email.com",

		TiendaNombre: "BLEND Fashion Store",
		TiendaDirecc: "Av. Corrientes 1234, CABA",
		TiendaTelef:  "+54 11 1234-5678",
		TiendaCUIT:   "20-12345678-9",

		Items: []VentaItem{
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
			{
				ProductoNombre: "Zapatillas Puma Runner",
				Cantidad:       1,
				PrecioUnitario: 45000,
				Subtotal:       45000,
			},
		},

		Subtotal: 100000,
		IVA:      21000,
		Total:    121000,

		QRData: "https://blend.com.ar/verify/VTA-2024-001234",
	}

	t.Run("Genera PDF exitosamente", func(t *testing.T) {
		pdfBytes, err := generator.GenerateInvoice(testData)
		require.NoError(t, err)
		assert.NotNil(t, pdfBytes)
		assert.Greater(t, len(pdfBytes), 1000, "El PDF debe tener contenido")
	})

	t.Run("PDF con consumidor final", func(t *testing.T) {
		dataConsumidorFinal := testData
		dataConsumidorFinal.ClienteNombre = ""
		dataConsumidorFinal.ClienteEmail = ""

		pdfBytes, err := generator.GenerateInvoice(dataConsumidorFinal)
		require.NoError(t, err)
		assert.NotNil(t, pdfBytes)
	})

	t.Run("PDF con muchos items", func(t *testing.T) {
		dataMuchos := testData
		dataMuchos.Items = make([]VentaItem, 20)
		for i := 0; i < 20; i++ {
			dataMuchos.Items[i] = VentaItem{
				ProductoNombre: "Producto " + string(rune('A'+i)),
				Cantidad:       float64(i + 1),
				PrecioUnitario: 1000 * float64(i+1),
				Subtotal:       1000 * float64(i+1) * float64(i+1),
			}
		}

		pdfBytes, err := generator.GenerateInvoice(dataMuchos)
		require.NoError(t, err)
		assert.NotNil(t, pdfBytes)
	})
}

func TestHelpers(t *testing.T) {
	t.Run("formatCurrency formatea correctamente", func(t *testing.T) {
		assert.Equal(t, "$100.00", formatCurrency(100))
		assert.Equal(t, "$1234.56", formatCurrency(1234.56))
		assert.Equal(t, "$0.00", formatCurrency(0))
	})

	t.Run("getClienteNombre maneja vacío", func(t *testing.T) {
		assert.Equal(t, "Consumidor Final", getClienteNombre(""))
		assert.Equal(t, "Juan Pérez", getClienteNombre("Juan Pérez"))
	})

	t.Run("getQRData genera URL por defecto", func(t *testing.T) {
		assert.Equal(t, "custom-data", getQRData("custom-data", "123"))
		assert.Equal(t, "https://blend.com.ar/verify/VTA-123", getQRData("", "VTA-123"))
	})
}
