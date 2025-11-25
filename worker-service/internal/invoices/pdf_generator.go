package invoices

import (
	"fmt"
	"time"

	"github.com/johnfercher/maroto/v2"
	"github.com/johnfercher/maroto/v2/pkg/components/code"
	"github.com/johnfercher/maroto/v2/pkg/components/col"
	"github.com/johnfercher/maroto/v2/pkg/components/image"
	"github.com/johnfercher/maroto/v2/pkg/components/line"
	"github.com/johnfercher/maroto/v2/pkg/components/row"
	"github.com/johnfercher/maroto/v2/pkg/components/text"
	"github.com/johnfercher/maroto/v2/pkg/config"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/consts/border"
	"github.com/johnfercher/maroto/v2/pkg/consts/fontstyle"
	"github.com/johnfercher/maroto/v2/pkg/core"
	"github.com/johnfercher/maroto/v2/pkg/props"
)

// VentaItem representa un item de la venta para el PDF
type VentaItem struct {
	ProductoNombre string
	Cantidad       float64
	PrecioUnitario float64
	Subtotal       float64
}

// VentaPDFData contiene toda la información para generar el PDF
type VentaPDFData struct {
	// Venta
	VentaID      string
	Fecha        time.Time
	MetodoPago   string
	
	// Cliente (opcional)
	ClienteNombre string
	ClienteEmail  string
	
	// Tienda
	TiendaNombre  string
	TiendaDirecc  string
	TiendaTelef   string
	TiendaCUIT    string
	
	// Items
	Items []VentaItem
	
	// Totales
	Subtotal float64
	IVA      float64
	Total    float64
	
	// QR (puede ser URL de validación)
	QRData string
}

// PDFGenerator genera comprobantes de venta en PDF
type PDFGenerator struct {
	// Configuración
	logoPath string
}

// NewPDFGenerator crea un nuevo generador de PDFs
func NewPDFGenerator(logoPath string) *PDFGenerator {
	return &PDFGenerator{
		logoPath: logoPath,
	}
}

// GenerateInvoice genera un PDF de factura/comprobante
func (g *PDFGenerator) GenerateInvoice(data VentaPDFData) ([]byte, error) {
	// Configurar Maroto
	cfg := config.NewBuilder().
		WithPageNumber("Página {current} de {total}", props.RightBottom).
		WithMargins(10, 15, 10).
		Build()

	mrt := maroto.New(cfg)
	m := maroto.NewMetricsDecorator(mrt)

	// ==================== HEADER ====================
	g.buildHeader(m, data)

	// ==================== INFO SECTION ====================
	g.buildInfoSection(m, data)

	// ==================== ITEMS TABLE ====================
	g.buildItemsTable(m, data)

	// ==================== TOTALS ====================
	g.buildTotals(m, data)

	// ==================== FOOTER WITH QR ====================
	g.buildFooter(m, data)

	// Generar documento
	document, err := m.Generate()
	if err != nil {
		return nil, fmt.Errorf("error al generar PDF: %w", err)
	}

	return document.GetBytes(), nil
}

// buildHeader construye el encabezado con logo y título
func (g *PDFGenerator) buildHeader(m core.Maroto, data VentaPDFData) {
	m.AddRow(20,
		col.New(3).Add(
			// Logo (si existe)
			// image.NewFromFileCol(3, g.logoPath, props.Rect{
			// 	Center:  true,
			// 	Percent: 80,
			// }),
			text.New("BLEND", props.Text{
				Top:   5,
				Size:  18,
				Style: fontstyle.Bold,
				Align: align.Left,
				Color: &props.Color{Red: 99, Green: 102, Blue: 241}, // Indigo-500
			}),
		),
		col.New(6).Add(
			text.New("COMPROBANTE DE VENTA", props.Text{
				Top:   8,
				Size:  14,
				Style: fontstyle.Bold,
				Align: align.Center,
			}),
		),
		col.New(3).Add(
			text.New(fmt.Sprintf("N° %s", data.VentaID), props.Text{
				Top:   5,
				Size:  10,
				Style: fontstyle.Bold,
				Align: align.Right,
			}),
			text.New(data.Fecha.Format("02/01/2006 15:04"), props.Text{
				Top:   10,
				Size:  8,
				Align: align.Right,
				Color: &props.Color{Red: 100, Green: 116, Blue: 139}, // Slate-500
			}),
		),
	)

	// Línea separadora
	m.AddRow(2, line.NewCol(12, props.Line{
		Color: &props.Color{Red: 226, Green: 232, Blue: 240}, // Slate-200
		Style: border.Solid,
		Thickness: 1,
	}))
}

// buildInfoSection construye la sección de información
func (g *PDFGenerator) buildInfoSection(m core.Maroto, data VentaPDFData) {
	m.AddRow(15,
		// Info Tienda
		col.New(6).Add(
			text.New("DATOS DE LA TIENDA", props.Text{
				Size:  9,
				Style: fontstyle.Bold,
				Color: &props.Color{Red: 51, Green: 65, Blue: 85}, // Slate-700
			}),
			text.New(data.TiendaNombre, props.Text{
				Top:  3,
				Size: 9,
			}),
			text.New(data.TiendaDirecc, props.Text{
				Top:  6,
				Size: 8,
				Color: &props.Color{Red: 100, Green: 116, Blue: 139},
			}),
			text.New(fmt.Sprintf("Tel: %s", data.TiendaTelef), props.Text{
				Top:  9,
				Size: 8,
				Color: &props.Color{Red: 100, Green: 116, Blue: 139},
			}),
			text.New(fmt.Sprintf("CUIT: %s", data.TiendaCUIT), props.Text{
				Top:  12,
				Size: 8,
				Color: &props.Color{Red: 100, Green: 116, Blue: 139},
			}),
		),
		// Info Cliente
		col.New(6).Add(
			text.New("DATOS DEL CLIENTE", props.Text{
				Size:  9,
				Style: fontstyle.Bold,
				Align: align.Right,
				Color: &props.Color{Red: 51, Green: 65, Blue: 85},
			}),
			text.New(getClienteNombre(data.ClienteNombre), props.Text{
				Top:   3,
				Size:  9,
				Align: align.Right,
			}),
			text.New(data.ClienteEmail, props.Text{
				Top:   6,
				Size:  8,
				Align: align.Right,
				Color: &props.Color{Red: 100, Green: 116, Blue: 139},
			}),
			text.New(fmt.Sprintf("Método de Pago: %s", data.MetodoPago), props.Text{
				Top:   10,
				Size:  8,
				Align: align.Right,
				Style: fontstyle.Bold,
				Color: &props.Color{Red: 16, Green: 185, Blue: 129}, // Green-500
			}),
		),
	)

	m.AddRow(2, line.NewCol(12, props.Line{
		Color: &props.Color{Red: 226, Green: 232, Blue: 240},
		Style: border.Solid,
		Thickness: 1,
	}))
}

// buildItemsTable construye la tabla de items
func (g *PDFGenerator) buildItemsTable(m core.Maroto, data VentaPDFData) {
	// Header de la tabla
	m.AddRow(8,
		col.New(6).Add(
			text.New("Producto", props.Text{
				Size:  9,
				Style: fontstyle.Bold,
				Color: &props.Color{Red: 255, Green: 255, Blue: 255},
			}),
		),
		col.New(2).Add(
			text.New("Cantidad", props.Text{
				Size:  9,
				Style: fontstyle.Bold,
				Align: align.Center,
				Color: &props.Color{Red: 255, Green: 255, Blue: 255},
			}),
		),
		col.New(2).Add(
			text.New("Precio Unit.", props.Text{
				Size:  9,
				Style: fontstyle.Bold,
				Align: align.Right,
				Color: &props.Color{Red: 255, Green: 255, Blue: 255},
			}),
		),
		col.New(2).Add(
			text.New("Subtotal", props.Text{
				Size:  9,
				Style: fontstyle.Bold,
				Align: align.Right,
				Color: &props.Color{Red: 255, Green: 255, Blue: 255},
			}),
		),
	).WithStyle(&props.Cell{
		BackgroundColor: &props.Color{Red: 99, Green: 102, Blue: 241}, // Indigo-500
	})

	// Items
	for _, item := range data.Items {
		m.AddRow(7,
			col.New(6).Add(
				text.New(item.ProductoNombre, props.Text{
					Size: 9,
				}),
			),
			col.New(2).Add(
				text.New(fmt.Sprintf("%.2f", item.Cantidad), props.Text{
					Size:  9,
					Align: align.Center,
				}),
			),
			col.New(2).Add(
				text.New(formatCurrency(item.PrecioUnitario), props.Text{
					Size:  9,
					Align: align.Right,
				}),
			),
			col.New(2).Add(
				text.New(formatCurrency(item.Subtotal), props.Text{
					Size:  9,
					Align: align.Right,
					Style: fontstyle.Bold,
				}),
			),
		).WithStyle(&props.Cell{
			BorderColor: &props.Color{Red: 226, Green: 232, Blue: 240},
			BorderType:  border.Bottom,
			BorderThickness: 0.5,
		})
	}
}

// buildTotals construye la sección de totales
func (g *PDFGenerator) buildTotals(m core.Maroto, data VentaPDFData) {
	m.AddRow(3) // Espacio

	m.AddRow(6,
		col.New(8),
		col.New(2).Add(
			text.New("Subtotal:", props.Text{
				Size:  9,
				Align: align.Right,
			}),
		),
		col.New(2).Add(
			text.New(formatCurrency(data.Subtotal), props.Text{
				Size:  9,
				Align: align.Right,
			}),
		),
	)

	m.AddRow(6,
		col.New(8),
		col.New(2).Add(
			text.New("IVA (21%):", props.Text{
				Size:  9,
				Align: align.Right,
			}),
		),
		col.New(2).Add(
			text.New(formatCurrency(data.IVA), props.Text{
				Size:  9,
				Align: align.Right,
			}),
		),
	)

	m.AddRow(8,
		col.New(8),
		col.New(2).Add(
			text.New("TOTAL:", props.Text{
				Size:  11,
				Style: fontstyle.Bold,
				Align: align.Right,
			}),
		),
		col.New(2).Add(
			text.New(formatCurrency(data.Total), props.Text{
				Size:  11,
				Style: fontstyle.Bold,
				Align: align.Right,
				Color: &props.Color{Red: 16, Green: 185, Blue: 129},
			}),
		),
	).WithStyle(&props.Cell{
		BackgroundColor: &props.Color{Red: 241, Green: 245, Blue: 249}, // Slate-100
		BorderColor:     &props.Color{Red: 99, Green: 102, Blue: 241},
		BorderType:      border.Top,
		BorderThickness: 2,
	})
}

// buildFooter construye el footer con QR y mensaje
func (g *PDFGenerator) buildFooter(m core.Maroto, data VentaPDFData) {
	m.AddRow(5) // Espacio

	m.AddRow(30,
		col.New(8).Add(
			text.New("Gracias por su compra", props.Text{
				Top:   5,
				Size:  10,
				Style: fontstyle.Bold,
			}),
			text.New("Este comprobante es válido como factura electrónica.", props.Text{
				Top:   10,
				Size:  8,
				Color: &props.Color{Red: 100, Green: 116, Blue: 139},
			}),
			text.New("Conserve este documento para futuras consultas.", props.Text{
				Top:   14,
				Size:  8,
				Color: &props.Color{Red: 100, Green: 116, Blue: 139},
			}),
			text.New("Soporte: soporte@blend.com.ar", props.Text{
				Top:   20,
				Size:  7,
				Color: &props.Color{Red: 100, Green: 116, Blue: 139},
			}),
		),
		col.New(4).Add(
			code.NewQrCol(4, getQRData(data.QRData, data.VentaID), props.Rect{
				Center:  true,
				Percent: 70,
			}),
			text.New("Escanee para validar", props.Text{
				Top:   25,
				Size:  7,
				Align: align.Center,
				Color: &props.Color{Red: 100, Green: 116, Blue: 139},
			}),
		),
	)
}

// ==================== HELPERS ====================

func formatCurrency(amount float64) string {
	return fmt.Sprintf("$%.2f", amount)
}

func getClienteNombre(nombre string) string {
	if nombre == "" {
		return "Consumidor Final"
	}
	return nombre
}

func getQRData(qrData, ventaID string) string {
	if qrData != "" {
		return qrData
	}
	// QR por defecto con ID de venta
	return fmt.Sprintf("https://blend.com.ar/verify/%s", ventaID)
}
