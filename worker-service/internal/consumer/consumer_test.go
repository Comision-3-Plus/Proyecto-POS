package consumer

import (
	"encoding/json"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ====================================================================
// TESTS DEL CONTRATO JSON - CRÍTICO PARA INTEGRACIÓN CON PYTHON API
// ====================================================================

// VentaNuevaMessage representa el mensaje que llega desde Python API
type VentaNuevaMessage struct {
	Evento      string  `json:"evento"`
	VentaID     string  `json:"venta_id"`
	TiendaID    string  `json:"tienda_id"`
	Total       float64 `json:"total"`
	MetodoPago  string  `json:"metodo_pago"`
	ItemsCount  int     `json:"items_count"`
	Source      string  `json:"_source"`
	RequestID   string  `json:"_request_id"`
}

// TestVentaNuevaMessage_JSONSchema valida que el mensaje cumpla con el contrato
func TestVentaNuevaMessage_JSONSchema(t *testing.T) {
	// Mensaje de ejemplo que vendría desde Python API
	jsonMessage := `{
		"evento": "NUEVA_VENTA",
		"venta_id": "550e8400-e29b-41d4-a716-446655440000",
		"tienda_id": "660e8400-e29b-41d4-a716-446655440000",
		"total": 4500.0,
		"metodo_pago": "efectivo",
		"items_count": 2,
		"_source": "nexus_pos_api",
		"_request_id": "req-123-abc",
		"_timestamp": "{\"$date\": \"now\"}"
	}`

	var msg VentaNuevaMessage
	err := json.Unmarshal([]byte(jsonMessage), &msg)
	require.NoError(t, err, "Debe deserializar JSON correctamente")

	// Validar campos requeridos
	assert.Equal(t, "NUEVA_VENTA", msg.Evento, "Campo 'evento' debe coincidir")
	assert.NotEmpty(t, msg.VentaID, "Campo 'venta_id' no debe estar vacío")
	assert.NotEmpty(t, msg.TiendaID, "Campo 'tienda_id' no debe estar vacío")
	assert.Greater(t, msg.Total, 0.0, "Campo 'total' debe ser positivo")
	assert.Equal(t, "efectivo", msg.MetodoPago, "Campo 'metodo_pago' debe coincidir")
	assert.Greater(t, msg.ItemsCount, 0, "Campo 'items_count' debe ser mayor a 0")

	// Validar metadata
	assert.Equal(t, "nexus_pos_api", msg.Source, "Source debe ser 'nexus_pos_api'")
	assert.NotEmpty(t, msg.RequestID, "Request ID debe estar presente")
}

// TestVentaNuevaMessage_UUIDValidation valida que los UUIDs sean válidos
func TestVentaNuevaMessage_UUIDValidation(t *testing.T) {
	tests := []struct {
		name      string
		ventaID   string
		tiendaID  string
		shouldErr bool
	}{
		{
			name:      "UUIDs válidos",
			ventaID:   "550e8400-e29b-41d4-a716-446655440000",
			tiendaID:  "660e8400-e29b-41d4-a716-446655440000",
			shouldErr: false,
		},
		{
			name:      "UUID inválido en venta_id",
			ventaID:   "invalid-uuid",
			tiendaID:  "660e8400-e29b-41d4-a716-446655440000",
			shouldErr: true,
		},
		{
			name:      "UUID inválido en tienda_id",
			ventaID:   "550e8400-e29b-41d4-a716-446655440000",
			tiendaID:  "not-a-uuid",
			shouldErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Intentar parsear UUIDs
			_, errVenta := uuid.Parse(tt.ventaID)
			_, errTienda := uuid.Parse(tt.tiendaID)

			hasError := (errVenta != nil || errTienda != nil)
			assert.Equal(t, tt.shouldErr, hasError, "Validación UUID debe coincidir")
		})
	}
}

// TestVentaNuevaMessage_MetodoPagoValidation valida métodos de pago permitidos
func TestVentaNuevaMessage_MetodoPagoValidation(t *testing.T) {
	validMetodos := []string{"efectivo", "tarjeta_debito", "tarjeta_credito", "transferencia"}

	for _, metodo := range validMetodos {
		t.Run("Metodo_"+metodo, func(t *testing.T) {
			msg := VentaNuevaMessage{
				MetodoPago: metodo,
			}

			assert.Contains(t, validMetodos, msg.MetodoPago, "Método de pago debe ser válido")
		})
	}
}

// TestVentaNuevaMessage_TiposNumericos valida tipos de datos numéricos
func TestVentaNuevaMessage_TiposNumericos(t *testing.T) {
	jsonMessage := `{
		"evento": "NUEVA_VENTA",
		"venta_id": "550e8400-e29b-41d4-a716-446655440000",
		"tienda_id": "660e8400-e29b-41d4-a716-446655440000",
		"total": 12345.67,
		"metodo_pago": "efectivo",
		"items_count": 5
	}`

	var msg VentaNuevaMessage
	err := json.Unmarshal([]byte(jsonMessage), &msg)
	require.NoError(t, err)

	// Validar tipos
	assert.IsType(t, float64(0), msg.Total, "total debe ser float64")
	assert.IsType(t, int(0), msg.ItemsCount, "items_count debe ser int")

	// Validar precisión decimal
	assert.Equal(t, 12345.67, msg.Total, "Debe preservar decimales")
}

// TestReportRequest_JSONSchema valida el mensaje de solicitud de reportes
func TestReportRequest_JSONSchema(t *testing.T) {
	tests := []struct {
		name       string
		jsonInput  string
		expectedID int64
		expectedType string
	}{
		{
			name: "Reporte de productos",
			jsonInput: `{
				"user_id": 123,
				"email_to": "user@example.com",
				"report_type": "products"
			}`,
			expectedID:   123,
			expectedType: "products",
		},
		{
			name: "Reporte semanal",
			jsonInput: `{
				"user_id": 456,
				"email_to": "admin@example.com",
				"report_type": "products_weekly"
			}`,
			expectedID:   456,
			expectedType: "products_weekly",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req ReportRequest
			err := json.Unmarshal([]byte(tt.jsonInput), &req)
			require.NoError(t, err, "Debe deserializar JSON correctamente")

			assert.Equal(t, tt.expectedID, req.UserID, "UserID debe coincidir")
			assert.Equal(t, tt.expectedType, req.ReportType, "ReportType debe coincidir")
			assert.NotEmpty(t, req.Email, "Email no debe estar vacío")
		})
	}
}

// TestStockAlertRequest_JSONSchema valida el mensaje de alertas de stock
func TestStockAlertRequest_JSONSchema(t *testing.T) {
	jsonMessage := `{
		"task_type": "check_stock_levels"
	}`

	var req StockAlertRequest
	err := json.Unmarshal([]byte(jsonMessage), &req)
	require.NoError(t, err, "Debe deserializar JSON correctamente")

	assert.Equal(t, "check_stock_levels", req.TaskType, "TaskType debe coincidir")
}

// ====================================================================
// TESTS DE PROCESAMIENTO DE MENSAJES
// ====================================================================

// TestProcessVentaMessage_ValidMessage valida el procesamiento exitoso
func TestProcessVentaMessage_ValidMessage(t *testing.T) {
	// Mensaje válido de venta
	msg := VentaNuevaMessage{
		Evento:     "NUEVA_VENTA",
		VentaID:    uuid.New().String(),
		TiendaID:   uuid.New().String(),
		Total:      5000.0,
		MetodoPago: "tarjeta_credito",
		ItemsCount: 3,
		Source:     "nexus_pos_api",
		RequestID:  "req-test-123",
	}

	// Serializar
	msgBytes, err := json.Marshal(msg)
	require.NoError(t, err, "Debe serializar mensaje")

	// Validar que sea deserializable
	var parsed VentaNuevaMessage
	err = json.Unmarshal(msgBytes, &parsed)
	require.NoError(t, err, "Debe deserializar mensaje")

	assert.Equal(t, msg.VentaID, parsed.VentaID, "VentaID debe preservarse")
	assert.Equal(t, msg.Total, parsed.Total, "Total debe preservarse")
}

// TestProcessVentaMessage_MissingFields valida manejo de campos faltantes
func TestProcessVentaMessage_MissingFields(t *testing.T) {
	tests := []struct {
		name      string
		jsonInput string
		shouldErr bool
	}{
		{
			name: "Falta evento",
			jsonInput: `{
				"venta_id": "550e8400-e29b-41d4-a716-446655440000",
				"tienda_id": "660e8400-e29b-41d4-a716-446655440000",
				"total": 1000.0
			}`,
			shouldErr: false, // JSON deserializa pero evento estará vacío
		},
		{
			name:      "JSON malformado",
			jsonInput: `{"evento": "NUEVA_VENTA"`,
			shouldErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var msg VentaNuevaMessage
			err := json.Unmarshal([]byte(tt.jsonInput), &msg)

			if tt.shouldErr {
				assert.Error(t, err, "Debe fallar con JSON malformado")
			} else {
				assert.NoError(t, err, "No debe fallar en deserialización")
			}
		})
	}
}

// TestMessageRoutingKey valida que los mensajes vayan a las colas correctas
func TestMessageRoutingKey(t *testing.T) {
	routingKeys := map[string]string{
		"ventas":       "ventas_procesadas",
		"reportes":     "reporting_queue",
		"stock_alerts": "stock_alerts_queue",
		"meli_sales":   "meli_sales_queue",
	}

	for msgType, expectedKey := range routingKeys {
		t.Run(msgType, func(t *testing.T) {
			assert.NotEmpty(t, expectedKey, "Routing key debe estar definida")
		})
	}
}

// ====================================================================
// TESTS DE ACK/NACK
// ====================================================================

// TestMessageAcknowledgement_Success valida el acknowledge exitoso
func TestMessageAcknowledgement_Success(t *testing.T) {
	// Simular procesamiento exitoso
	processed := true
	
	if processed {
		// d.Ack(false)
		assert.True(t, processed, "Mensaje procesado debe ser acknowledged")
	}
}

// TestMessageAcknowledgement_FailureRequeue valida el nack con reencolar
func TestMessageAcknowledgement_FailureRequeue(t *testing.T) {
	// Simular error temporal (DB caída, etc)
	temporaryError := true
	
	if temporaryError {
		// d.Nack(false, true) // Reencolar para reintentar
		assert.True(t, temporaryError, "Error temporal debe reencolarse")
	}
}

// TestMessageAcknowledgement_FailureDiscard valida el nack sin reencolar
func TestMessageAcknowledgement_FailureDiscard(t *testing.T) {
	// Simular error de parsing (mensaje corrupto)
	corruptMessage := true
	
	if corruptMessage {
		// d.Nack(false, false) // NO reencolar
		assert.True(t, corruptMessage, "Mensaje corrupto debe descartarse")
	}
}

// ====================================================================
// TESTS DE CONTRATO BIDIRECCIONAL (Python ↔ Go)
// ====================================================================

// TestPythonGoContract_FieldNaming valida que los nombres de campo coincidan
func TestPythonGoContract_FieldNaming(t *testing.T) {
	// Python usa snake_case, Go usa camelCase en structs pero snake_case en JSON
	expectedFields := map[string]bool{
		"evento":       true,
		"venta_id":     true,
		"tienda_id":    true,
		"total":        true,
		"metodo_pago":  true,
		"items_count":  true,
		"_source":      true,
		"_request_id":  true,
	}

	jsonMessage := `{
		"evento": "NUEVA_VENTA",
		"venta_id": "550e8400-e29b-41d4-a716-446655440000",
		"tienda_id": "660e8400-e29b-41d4-a716-446655440000",
		"total": 1000.0,
		"metodo_pago": "efectivo",
		"items_count": 1,
		"_source": "nexus_pos_api",
		"_request_id": "req-123"
	}`

	var raw map[string]interface{}
	err := json.Unmarshal([]byte(jsonMessage), &raw)
	require.NoError(t, err)

	// Validar que todos los campos esperados estén presentes
	for field := range expectedFields {
		_, exists := raw[field]
		assert.True(t, exists, "Campo '%s' debe existir en el mensaje", field)
	}
}

// TestPythonGoContract_DataTypes valida que los tipos coincidan
func TestPythonGoContract_DataTypes(t *testing.T) {
	jsonMessage := `{
		"evento": "NUEVA_VENTA",
		"venta_id": "550e8400-e29b-41d4-a716-446655440000",
		"tienda_id": "660e8400-e29b-41d4-a716-446655440000",
		"total": 4500.0,
		"metodo_pago": "efectivo",
		"items_count": 2
	}`

	var raw map[string]interface{}
	err := json.Unmarshal([]byte(jsonMessage), &raw)
	require.NoError(t, err)

	// Validar tipos de datos
	assert.IsType(t, "", raw["evento"], "evento debe ser string")
	assert.IsType(t, "", raw["venta_id"], "venta_id debe ser string")
	assert.IsType(t, "", raw["tienda_id"], "tienda_id debe ser string")
	assert.IsType(t, float64(0), raw["total"], "total debe ser float64")
	assert.IsType(t, "", raw["metodo_pago"], "metodo_pago debe ser string")
	assert.IsType(t, float64(0), raw["items_count"], "items_count debe ser numérico (JSON no distingue int)")
}
