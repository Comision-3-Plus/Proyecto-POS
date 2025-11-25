package email

import (
	"bytes"
	"embed"
	"encoding/base64"
	"fmt"
	"html/template"
	"log"
	"time"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

//go:embed templates/*.html
var templatesFS embed.FS

// Client encapsula la configuración de SendGrid con soporte para templates HTML
type Client struct {
	apiKey     string
	fromEmail  string
	fromName   string
	sgClient   *sendgrid.Client
	isDisabled bool
	templates  *template.Template
}

// NewClient crea un nuevo cliente de SendGrid con templates
func NewClient(apiKey, fromEmail, fromName string) *Client {
	if apiKey == "" {
		log.Println("⚠️  SENDGRID_API_KEY no configurado. Los emails NO se enviarán.")
		return &Client{
			isDisabled: true,
		}
	}

	// Cargar templates
	tmpl, err := template.ParseFS(templatesFS, "templates/*.html")
	if err != nil {
		log.Printf("⚠️  Error cargando templates: %v. Usando fallback.", err)
	}

	return &Client{
		apiKey:     apiKey,
		fromEmail:  fromEmail,
		fromName:   fromName,
		sgClient:   sendgrid.NewSendClient(apiKey),
		isDisabled: false,
		templates:  tmpl,
	}
}

// EmailAttachment representa un archivo adjunto
type EmailAttachment struct {
	Filename    string
	Content     []byte
	ContentType string
}

// StockAlertData contiene los datos para alertas de stock
type StockAlertData struct {
	Titulo       string
	Mensaje      string
	Prioridad    string
	AlertIcon    string
	ProductName  string
	CurrentStock int
	Threshold    int
	ActionURL    string
	ActionText   string
}

// ==================== WELCOME EMAIL ====================

// WelcomeEmailData contiene los datos para el template de bienvenida
type WelcomeEmailData struct {
	NombreCliente string
	DashboardURL  string
	Year          int
}

// SendWelcomeEmail envía un email de bienvenida usando template HTML
func (c *Client) SendWelcomeEmail(toEmail, nombreCliente, dashboardURL string) error {
	if c.isDisabled {
		log.Printf("📧 [MODO DEV] Email de bienvenida simulado a %s", toEmail)
		return nil
	}

	data := WelcomeEmailData{
		NombreCliente: nombreCliente,
		DashboardURL:  dashboardURL,
		Year:          time.Now().Year(),
	}

	htmlContent, err := c.renderTemplate("welcome.html", data)
	if err != nil {
		return fmt.Errorf("error renderizando template: %w", err)
	}

	return c.sendEmail(toEmail, nombreCliente, "¡Bienvenido a BLEND! 🎉", htmlContent, nil)
}

// ==================== TICKET EMAIL ====================

// TicketEmailData contiene los datos para el comprobante de venta
type TicketEmailData struct {
	VentaID        string
	Fecha          string
	ClienteNombre  string
	TiendaNombre   string
	MetodoPago     string
	Items          []TicketItem
	Subtotal       string
	IVA            string
	Total          string
	ComprobanteURL string
	Year           int
}

// TicketItem representa un item en el comprobante
type TicketItem struct {
	ProductoNombre string
	Cantidad       string
	PrecioUnitario string
	Subtotal       string
}

// SendTicketEmail envía el comprobante de venta por email
func (c *Client) SendTicketEmail(toEmail string, data TicketEmailData) error {
	if c.isDisabled {
		log.Printf("📧 [MODO DEV] Comprobante simulado a %s - Venta: %s", toEmail, data.VentaID)
		return nil
	}

	data.Year = time.Now().Year()

	htmlContent, err := c.renderTemplate("ticket.html", data)
	if err != nil {
		return fmt.Errorf("error renderizando template: %w", err)
	}

	subject := fmt.Sprintf("Comprobante de Venta #%s", data.VentaID)
	return c.sendEmail(toEmail, data.ClienteNombre, subject, htmlContent, nil)
}

// ==================== ALERT EMAIL ====================

// AlertEmailData contiene los datos para emails de alerta
type AlertEmailData struct {
	AlertClass      string // "warning", "info", "" (critical)
	AlertIcon       string // "⚠️", "ℹ️", "🚨"
	AlertLevel      string // "Alerta Crítica", "Atención", "Información"
	Titulo          string
	Mensaje         string
	Details         []AlertDetail
	Recomendaciones []string
	ActionURL       string
	ActionText      string
	Year            int
}

// AlertDetail representa un detalle de la alerta
type AlertDetail struct {
	Label string
	Value string
	Class string // "critical", ""
}

// SendAlertEmail envía un email de alerta
func (c *Client) SendAlertEmail(toEmail, tipoAlerta string, data AlertEmailData) error {
	if c.isDisabled {
		log.Printf("📧 [MODO DEV] Alerta simulada a %s - Tipo: %s", toEmail, tipoAlerta)
		return nil
	}

	data.Year = time.Now().Year()

	// Configurar según tipo de alerta
	switch tipoAlerta {
	case "stock_bajo":
		if data.AlertClass == "" {
			data.AlertClass = "warning"
		}
		if data.AlertIcon == "" {
			data.AlertIcon = "⚠️"
		}
		if data.AlertLevel == "" {
			data.AlertLevel = "Alerta de Stock Bajo"
		}
	case "stock_critico":
		if data.AlertClass == "" {
			data.AlertClass = ""
		}
		if data.AlertIcon == "" {
			data.AlertIcon = "🚨"
		}
		if data.AlertLevel == "" {
			data.AlertLevel = "Alerta Crítica"
		}
	default:
		if data.AlertClass == "" {
			data.AlertClass = "info"
		}
		if data.AlertIcon == "" {
			data.AlertIcon = "ℹ️"
		}
		if data.AlertLevel == "" {
			data.AlertLevel = "Información"
		}
	}

	htmlContent, err := c.renderTemplate("alert.html", data)
	if err != nil {
		return fmt.Errorf("error renderizando template: %w", err)
	}

	subject := fmt.Sprintf("%s - %s", data.AlertIcon, data.Titulo)
	return c.sendEmail(toEmail, "", subject, htmlContent, nil)
}

// SendStockAlertEmail envía una alerta de stock bajo
func (c *Client) SendStockAlertEmail(toEmail, productName string, currentStock, threshold int) error {
	if c.isDisabled {
		log.Printf("📧 [MODO DEV] Alerta de stock simulada - Producto: %s (Stock: %d < %d)", productName, currentStock, threshold)
		return nil
	}

	data := StockAlertData{
		Titulo:       "⚠️ Alerta de Stock Bajo",
		Mensaje:      fmt.Sprintf("El producto <strong>%s</strong> tiene solo %d unidades en stock (mínimo: %d).", productName, currentStock, threshold),
		Prioridad:    "alta",
		AlertIcon:    "⚠️",
		ProductName:  productName,
		CurrentStock: currentStock,
		Threshold:    threshold,
		ActionURL:    "https://blend.app/inventario",
		ActionText:   "Ver Inventario",
	}

	htmlContent, err := c.renderTemplate("alert.html", data)
	if err != nil {
		// Fallback to simple HTML if template fails
		htmlContent = fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px;">
            <h2 style="color: #f59e0b; margin: 0 0 10px 0;">⚠️ Alerta de Stock Bajo</h2>
            <p>El producto <strong>%s</strong> tiene solo <strong>%d unidades</strong> en stock.</p>
            <p>Stock mínimo configurado: <strong>%d unidades</strong></p>
            <p style="margin-top: 20px;">
                <a href="https://blend.app/inventario" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Ver Inventario
                </a>
            </p>
        </div>
    </div>
</body>
</html>`, productName, currentStock, threshold)
	}

	subject := fmt.Sprintf("⚠️ Stock Bajo - %s", productName)
	return c.sendEmail(toEmail, "", subject, htmlContent, nil)
}

// ==================== REPORT EMAIL (Legacy, mantener compatibilidad) ====================

// SendReportEmail envía un email con reporte en Excel adjunto (legacy)
func (c *Client) SendReportEmail(toEmail, toName, reportType string, attachment EmailAttachment) error {
	if c.isDisabled {
		log.Printf("📧 [MODO DEV] Reporte simulado a %s - Adjunto: %s (%d bytes)", toEmail, attachment.Filename, len(attachment.Content))
		return nil
	}

	subject, htmlContent := getEmailContent(reportType)
	return c.sendEmail(toEmail, toName, subject, htmlContent, &attachment)
}

// ==================== HELPERS ====================

// renderTemplate renderiza un template HTML con los datos proporcionados
func (c *Client) renderTemplate(templateName string, data interface{}) (string, error) {
	if c.templates == nil {
		return "", fmt.Errorf("templates no cargados")
	}

	var buf bytes.Buffer
	err := c.templates.ExecuteTemplate(&buf, templateName, data)
	if err != nil {
		return "", err
	}

	return buf.String(), nil
}

// sendEmail es el método interno para enviar emails
func (c *Client) sendEmail(toEmail, toName, subject, htmlContent string, attachment *EmailAttachment) error {
	from := mail.NewEmail(c.fromName, c.fromEmail)
	to := mail.NewEmail(toName, toEmail)

	message := mail.NewSingleEmail(from, subject, to, "", htmlContent)

	// Adjuntar archivo si existe
	if attachment != nil {
		a := mail.NewAttachment()
		encoded := base64.StdEncoding.EncodeToString(attachment.Content)
		a.SetContent(encoded)
		a.SetType(attachment.ContentType)
		a.SetFilename(attachment.Filename)
		a.SetDisposition("attachment")
		message.AddAttachment(a)
	}

	// Enviar
	response, err := c.sgClient.Send(message)
	if err != nil {
		return fmt.Errorf("error al enviar email: %w", err)
	}

	if response.StatusCode >= 400 {
		return fmt.Errorf("SendGrid respondió con código %d: %s", response.StatusCode, response.Body)
	}

	log.Printf("✅ Email enviado exitosamente a %s (código: %d)", toEmail, response.StatusCode)
	return nil
}

// getEmailContent - función legacy para compatibilidad con reportes antiguos
func getEmailContent(reportType string) (subject string, htmlContent string) {
	subject = "📊 Tu Reporte está Listo"
	htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Reporte Generado</h1>
        </div>
        <div class="content">
            <p>¡Hola!</p>
            <p>Tu reporte ha sido generado exitosamente y está adjunto en este email.</p>
            <p>Gracias por usar <strong>BLEND</strong>.</p>
        </div>
        <div class="footer">
            <p>Este es un email automático, por favor no responder.</p>
            <p>BLEND &copy; 2025</p>
        </div>
    </div>
</body>
</html>
`
	return
}
