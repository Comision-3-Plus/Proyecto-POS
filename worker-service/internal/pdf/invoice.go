package pdf

import (
	"bytes"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jung-kurt/gofpdf"
	"github.com/skip2/go-qrcode"
)

// FacturaData contiene todos los datos necesarios para generar una factura
type FacturaData struct {
	// Datos de la tienda
	TiendaNombre    string
	TiendaCUIT      string
	TiendaDireccion string
	TiendaTelefono  string
	
	// Datos de la venta
	VentaID        uuid.UUID
	Fecha          time.Time
	Total          float64
	MetodoPago     string
	
	// Datos AFIP
	AFIPCAE        string
	AFIPCAEVto     time.Time
	TipoComprobante string // "FACTURA B", "TICKET", etc.
	PuntoVenta     int
	NumeroFactura  int
	
	// Items de la venta
	Items []FacturaItem
}

// FacturaItem representa un producto en la factura
type FacturaItem struct {
	Nombre         string
	Cantidad       float64
	PrecioUnitario float64
	Subtotal       float64
}

// GenerateInvoicePDF genera una factura PDF profesional con QR de AFIP
// Retorna el PDF como slice de bytes listo para enviar por email o descargar
func GenerateInvoicePDF(data FacturaData) ([]byte, error) {
	// Crear nuevo PDF en orientación vertical, unidad mm, tamaño A4
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	
	// === ENCABEZADO ===
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(0, 10, data.TiendaNombre)
	pdf.Ln(8)
	
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(0, 5, fmt.Sprintf("CUIT: %s", data.TiendaCUIT))
	pdf.Ln(5)
	pdf.Cell(0, 5, fmt.Sprintf("Dirección: %s", data.TiendaDireccion))
	pdf.Ln(5)
	pdf.Cell(0, 5, fmt.Sprintf("Teléfono: %s", data.TiendaTelefono))
	pdf.Ln(10)
	
	// === TIPO DE COMPROBANTE (Recuadro central) ===
	pdf.SetFont("Arial", "B", 20)
	pdf.SetX(95)
	pdf.Cell(20, 10, data.TipoComprobante) // "B", "C", etc.
	pdf.Ln(12)
	
	// === DATOS DE LA FACTURA ===
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 7, fmt.Sprintf("%s N° %04d-%08d", data.TipoComprobante, data.PuntoVenta, data.NumeroFactura))
	pdf.Ln(8)
	
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(0, 5, fmt.Sprintf("Fecha: %s", data.Fecha.Format("02/01/2006 15:04")))
	pdf.Ln(5)
	pdf.Cell(0, 5, fmt.Sprintf("ID Venta: %s", data.VentaID.String()))
	pdf.Ln(10)
	
	// === TABLA DE PRODUCTOS ===
	pdf.SetFont("Arial", "B", 10)
	pdf.SetFillColor(200, 220, 255)
	
	// Cabecera de tabla
	pdf.CellFormat(80, 7, "Producto", "1", 0, "L", true, 0, "")
	pdf.CellFormat(30, 7, "Cantidad", "1", 0, "C", true, 0, "")
	pdf.CellFormat(30, 7, "Precio Unit.", "1", 0, "R", true, 0, "")
	pdf.CellFormat(40, 7, "Subtotal", "1", 0, "R", true, 0, "")
	pdf.Ln(-1)
	
	// Filas de productos
	pdf.SetFont("Arial", "", 9)
	pdf.SetFillColor(255, 255, 255)
	
	for _, item := range data.Items {
		pdf.CellFormat(80, 6, item.Nombre, "1", 0, "L", false, 0, "")
		pdf.CellFormat(30, 6, fmt.Sprintf("%.2f", item.Cantidad), "1", 0, "C", false, 0, "")
		pdf.CellFormat(30, 6, fmt.Sprintf("$ %.2f", item.PrecioUnitario), "1", 0, "R", false, 0, "")
		pdf.CellFormat(40, 6, fmt.Sprintf("$ %.2f", item.Subtotal), "1", 0, "R", false, 0, "")
		pdf.Ln(-1)
	}
	
	// === TOTAL ===
	pdf.Ln(5)
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(140, 8, "TOTAL", "1", 0, "R", true, 0, "")
	pdf.CellFormat(40, 8, fmt.Sprintf("$ %.2f", data.Total), "1", 0, "R", true, 0, "")
	pdf.Ln(10)
	
	// === MÉTODO DE PAGO ===
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(0, 5, fmt.Sprintf("Método de Pago: %s", data.MetodoPago))
	pdf.Ln(10)
	
	// === DATOS AFIP ===
	if data.AFIPCAE != "" {
		pdf.SetFont("Arial", "B", 10)
		pdf.Cell(0, 5, "DATOS AFIP")
		pdf.Ln(6)
		
		pdf.SetFont("Arial", "", 9)
		pdf.Cell(0, 5, fmt.Sprintf("CAE: %s", data.AFIPCAE))
		pdf.Ln(5)
		pdf.Cell(0, 5, fmt.Sprintf("Vencimiento CAE: %s", data.AFIPCAEVto.Format("02/01/2006")))
		pdf.Ln(10)
		
		// === CÓDIGO QR DE AFIP ===
		qrData := fmt.Sprintf("https://www.afip.gob.ar/fe/qr/?p=%s", GenerateAFIPQRString(data))
		qrCode, err := qrcode.Encode(qrData, qrcode.Medium, 256)
		if err != nil {
			return nil, fmt.Errorf("error generating QR code: %w", err)
		}
		
		// Guardar QR temporalmente en buffer
		qrReader := bytes.NewReader(qrCode)
		imageInfo := pdf.RegisterImageReader("qr", "PNG", qrReader)
		if imageInfo != nil {
			pdf.Image("qr", 10, pdf.GetY(), 40, 40, false, "", 0, "")
		}
		
		pdf.SetY(pdf.GetY() + 42)
		pdf.SetFont("Arial", "I", 8)
		pdf.Cell(0, 4, "Escanee el código QR para validar en AFIP")
		pdf.Ln(8)
	}
	
	// === PIE DE PÁGINA ===
	pdf.SetY(-30)
	pdf.SetFont("Arial", "I", 8)
	pdf.SetTextColor(128, 128, 128)
	pdf.Cell(0, 5, "Documento no válido como factura fiscal - Comprobante interno")
	pdf.Ln(4)
	pdf.Cell(0, 5, "Generado por Super POS - www.superpos.com")
	
	// Escribir PDF a buffer
	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, fmt.Errorf("error writing PDF: %w", err)
	}
	
	return buf.Bytes(), nil
}

// GenerateAFIPQRString genera la cadena codificada para el QR de AFIP
// Formato: https://www.afip.gob.ar/fe/qr/?p={base64_data}
func GenerateAFIPQRString(data FacturaData) string {
	// Formato esperado por AFIP (ejemplo simplificado)
	// En producción, seguir especificación oficial de AFIP
	qrString := fmt.Sprintf(
		"ver=1&fecha=%s&cuit=%s&ptoVta=%d&tipoCmp=%s&nroCmp=%d&importe=%.2f&moneda=PES&ctz=1&tipoDocRec=99&nroDocRec=0&tipoCodAut=E&codAut=%s",
		data.Fecha.Format("2006-01-02"),
		data.TiendaCUIT,
		data.PuntoVenta,
		GetCodigoTipoComprobante(data.TipoComprobante),
		data.NumeroFactura,
		data.Total,
		data.AFIPCAE,
	)
	
	// En producción, encodear en Base64 según especificación AFIP
	return qrString
}

// GetCodigoTipoComprobante convierte texto a código AFIP
func GetCodigoTipoComprobante(tipo string) string {
	switch tipo {
	case "FACTURA A":
		return "1"
	case "FACTURA B":
		return "6"
	case "FACTURA C":
		return "11"
	case "TICKET":
		return "83"
	default:
		return "11" // Default a Factura C
	}
}
