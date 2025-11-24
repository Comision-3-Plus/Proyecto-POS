package consumer

import (
	"encoding/json"
	"fmt"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

// MessageMetadata metadata estándar de mensajes del event bus
type MessageMetadata struct {
	RequestID string `json:"_request_id"`
	Source    string `json:"_source"`
	Timestamp string `json:"_timestamp"`
}

// ExtractRequestID extrae el Request ID de un mensaje RabbitMQ
// Busca primero en headers, luego en el body
func ExtractRequestID(delivery amqp.Delivery) string {
	// 1. Intentar extraer de headers (más eficiente)
	if headers := delivery.Headers; headers != nil {
		if requestID, ok := headers["x-request-id"].(string); ok && requestID != "" {
			return requestID
		}
	}
	
	// 2. Intentar extraer del body JSON
	var metadata struct {
		RequestID string `json:"_request_id"`
	}
	
	if err := json.Unmarshal(delivery.Body, &metadata); err == nil {
		if metadata.RequestID != "" {
			return metadata.RequestID
		}
	}
	
	return "unknown"
}

// LogWithRequestID loguea un mensaje incluyendo el Request ID para trazabilidad
func LogWithRequestID(requestID, level, message string, args ...interface{}) {
	prefix := fmt.Sprintf("[Request-ID: %s] [%s] ", requestID, level)
	formattedMsg := fmt.Sprintf(prefix+message, args...)
	log.Println(formattedMsg)
}

// ProcessMessageWithTracing wrapper que agrega trazabilidad automática
// a cualquier handler de mensajes
func ProcessMessageWithTracing(
	delivery amqp.Delivery, 
	handler func(body []byte, requestID string) error,
) error {
	// Extraer Request ID
	requestID := ExtractRequestID(delivery)
	
	// Log inicio del procesamiento
	LogWithRequestID(requestID, "INFO", "📥 Procesando mensaje de cola: %s", delivery.RoutingKey)
	
	// Ejecutar handler con Request ID
	err := handler(delivery.Body, requestID)
	
	if err != nil {
		LogWithRequestID(requestID, "ERROR", "❌ Error procesando mensaje: %v", err)
		return err
	}
	
	LogWithRequestID(requestID, "INFO", "✅ Mensaje procesado exitosamente")
	return nil
}

// ExampleHandler ejemplo de handler que usa Request ID
func ExampleHandler(body []byte, requestID string) error {
	// Deserializar mensaje
	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		return fmt.Errorf("invalid JSON: %w", err)
	}
	
	// Procesar con contexto de Request ID disponible
	LogWithRequestID(requestID, "INFO", "Procesando datos: %+v", data)
	
	// Aquí iría la lógica de negocio...
	// El Request ID puede usarse para:
	// - Logging estructurado
	// - Enviar a servicios externos (e.g., enviar en email headers)
	// - Almacenar en base de datos para auditoría
	
	return nil
}

// ConsumeWithTracing configura un consumer con trazabilidad integrada
func ConsumeWithTracing(
	ch *amqp.Channel, 
	queueName string, 
	handler func(body []byte, requestID string) error,
) error {
	msgs, err := ch.Consume(
		queueName, // queue
		"",        // consumer tag
		false,     // auto-ack
		false,     // exclusive
		false,     // no-local
		false,     // no-wait
		nil,       // args
	)
	if err != nil {
		return fmt.Errorf("failed to register consumer: %w", err)
	}
	
	go func() {
		for delivery := range msgs {
			err := ProcessMessageWithTracing(delivery, handler)
			
			if err != nil {
				// NACK en caso de error (irá a DLQ si está configurado)
				delivery.Nack(false, false)
			} else {
				// ACK solo si fue exitoso
				delivery.Ack(false)
			}
		}
	}()
	
	log.Printf("📮 Consumer con trazabilidad iniciado para cola: %s", queueName)
	return nil
}
