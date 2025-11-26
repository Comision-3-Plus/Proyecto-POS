package handlers

import (
	"blend-agent/internal/printer"
	"encoding/json"
	"log"
	"net/http"
)

// HealthCheck retorna el estado del servicio
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status":  "healthy",
		"service": "Blend Agent",
		"version": "1.0.0",
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// ListPrinters retorna la lista de impresoras disponibles
func ListPrinters(manager *printer.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		printers, err := manager.DetectPrinters()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"printers": printers,
			"count":    len(printers),
		})
	}
}

// PrintFiscalTicketRequest es el payload para imprimir ticket fiscal
type PrintFiscalTicketRequest struct {
	Items   []printer.FiscalItem `json:"items"`
	Payment printer.PaymentInfo  `json:"payment"`
	Port    string               `json:"port,omitempty"` // Opcional, usa default si no se especifica
}

// PrintFiscalTicket imprime un ticket fiscal
func PrintFiscalTicket(manager *printer.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req PrintFiscalTicketRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		
		// Validaciones
		if len(req.Items) == 0 {
			http.Error(w, "Items cannot be empty", http.StatusBadRequest)
			return
		}
		
		if req.Payment.Amount <= 0 {
			http.Error(w, "Payment amount must be greater than 0", http.StatusBadRequest)
			return
		}
		
		// Obtener impresora
		var p *printer.Printer
		var err error
		
		if req.Port != "" {
			p, err = manager.GetPrinter(req.Port)
		} else {
			p, err = manager.GetDefaultPrinter()
		}
		
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		
		// Imprimir
		if err := p.Info.Driver().PrintFiscalTicket(req.Items, req.Payment); err != nil {
			log.Printf("❌ Error imprimiendo ticket: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "Ticket fiscal impreso correctamente",
		})
	}
}

// PrintNonFiscalTicketRequest es el payload para imprimir texto no fiscal
type PrintNonFiscalTicketRequest struct {
	Lines []string `json:"lines"`
	Port  string   `json:"port,omitempty"`
}

// PrintNonFiscalTicket imprime texto no fiscal
func PrintNonFiscalTicket(manager *printer.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req PrintNonFiscalTicketRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		
		if len(req.Lines) == 0 {
			http.Error(w, "Lines cannot be empty", http.StatusBadRequest)
			return
		}
		
		// Obtener impresora
		var p *printer.Printer
		var err error
		
		if req.Port != "" {
			p, err = manager.GetPrinter(req.Port)
		} else {
			p, err = manager.GetDefaultPrinter()
		}
		
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		
		// Imprimir
		if err := p.Info.Driver().PrintNonFiscalText(req.Lines); err != nil {
			log.Printf("❌ Error imprimiendo texto: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "Texto no fiscal impreso correctamente",
		})
	}
}

// GetPrinterStatus retorna el estado de la impresora
func GetPrinterStatus(manager *printer.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		port := r.URL.Query().Get("port")
		
		var p *printer.Printer
		var err error
		
		if port != "" {
			p, err = manager.GetPrinter(port)
		} else {
			p, err = manager.GetDefaultPrinter()
		}
		
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		
		status, err := p.Info.Driver().GetStatus()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(status)
	}
}

// DailyCloseRequest es el payload para cierre Z
type DailyCloseRequest struct {
	Port string `json:"port,omitempty"`
}

// DailyClose ejecuta el cierre diario (cierre Z)
func DailyClose(manager *printer.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req DailyCloseRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			// Body vacío es válido
			req = DailyCloseRequest{}
		}
		
		var p *printer.Printer
		var err error
		
		if req.Port != "" {
			p, err = manager.GetPrinter(req.Port)
		} else {
			p, err = manager.GetDefaultPrinter()
		}
		
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		
		result, err := p.Info.Driver().DailyClose()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
	}
}
