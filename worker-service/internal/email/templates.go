package email

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"

	"github.com/google/uuid"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

//go:embed templates/*.html
var templatesFS embed.FS

// WelcomeEmailData datos para email de bienvenida
type WelcomeEmailData struct {
	UserName     string
	UserEmail    string
	TiendaNombre string
	AppURL       string
}

// PasswordResetData datos para email de recuperación de contraseña
type PasswordResetData struct {
	UserName   string
	UserEmail  string
	ResetCode  string
	ResetURL   string
}

// PurchaseConfirmationData datos para email de confirmación de compra
type PurchaseConfirmationData struct {
	CustomerName   string
	CustomerEmail  string
	TiendaNombre   string
	TiendaEmail    string
	TiendaTelefono string
	VentaID        uuid.UUID
	Fecha          string
	MetodoPago     string
	Total          float64
	Items          []PurchaseItem
	AFIPCAE        string
	AFIPCAEVto     string
	InvoiceURL     string
}

// PurchaseItem representa un item en la compra
type PurchaseItem struct {
	Nombre         string
	Cantidad       float64
	PrecioUnitario float64
	Subtotal       float64
}

// RenderWelcomeEmail genera HTML del email de bienvenida
func RenderWelcomeEmail(data WelcomeEmailData) (string, error) {
	tmpl, err := template.ParseFS(templatesFS, "templates/welcome.html")
	if err != nil {
		return "", fmt.Errorf("error parsing welcome template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("error executing welcome template: %w", err)
	}

	return buf.String(), nil
}

// RenderPasswordResetEmail genera HTML del email de recuperación
func RenderPasswordResetEmail(data PasswordResetData) (string, error) {
	tmpl, err := template.ParseFS(templatesFS, "templates/password_reset.html")
	if err != nil {
		return "", fmt.Errorf("error parsing password reset template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("error executing password reset template: %w", err)
	}

	return buf.String(), nil
}

// RenderPurchaseConfirmationEmail genera HTML del email de confirmación
func RenderPurchaseConfirmationEmail(data PurchaseConfirmationData) (string, error) {
	tmpl, err := template.ParseFS(templatesFS, "templates/purchase_confirmation.html")
	if err != nil {
		return "", fmt.Errorf("error parsing purchase confirmation template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("error executing purchase confirmation template: %w", err)
	}

	return buf.String(), nil
}

// SendWelcomeEmail envía email de bienvenida usando SendGrid
func (c *Client) SendWelcomeEmail(to string, data WelcomeEmailData) error {
	htmlContent, err := RenderWelcomeEmail(data)
	if err != nil {
		return err
	}

	return c.SendHTMLEmail(
		to,
		"¡Bienvenido a Super POS! 🎉",
		htmlContent,
	)
}

// SendPasswordResetEmail envía email de recuperación de contraseña
func (c *Client) SendPasswordResetEmail(to string, data PasswordResetData) error {
	htmlContent, err := RenderPasswordResetEmail(data)
	if err != nil {
		return err
	}

	return c.SendHTMLEmail(
		to,
		"Recuperación de Contraseña - Super POS 🔐",
		htmlContent,
	)
}

// SendPurchaseConfirmationEmail envía email de confirmación de compra
func (c *Client) SendPurchaseConfirmationEmail(to string, data PurchaseConfirmationData) error {
	htmlContent, err := RenderPurchaseConfirmationEmail(data)
	if err != nil {
		return err
	}

	return c.SendHTMLEmail(
		to,
		fmt.Sprintf("Confirmación de Compra #%s - %s ✅", data.VentaID.String()[:8], data.TiendaNombre),
		htmlContent,
	)
}

// SendHTMLEmail envía un email HTML genérico usando SendGrid
func (c *Client) SendHTMLEmail(to, subject, htmlBody string) error {
	if c.isDisabled {
		return nil
	}
	
	// Crear el email desde
	from := mail.NewEmail(c.fromName, c.fromEmail)
	
	// Crear el email hacia
	toEmail := mail.NewEmail("", to)
	
	// Crear el mensaje
	message := mail.NewSingleEmail(from, subject, toEmail, "", htmlBody)
	
	response, err := c.sgClient.Send(message)
	if err != nil {
		return fmt.Errorf("error sending HTML email: %w", err)
	}

	if response.StatusCode >= 400 {
		return fmt.Errorf("sendgrid returned status %d: %s", response.StatusCode, response.Body)
	}

	return nil
}
