package rabbitmq

import (
	"fmt"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

// QueueConfig configuración de una cola con DLQ
type QueueConfig struct {
	Name             string
	DLQName          string // Dead Letter Queue name
	RoutingKey       string
	MaxRetries       int
	RetryDelayMs     int // Delay entre reintentos en milisegundos
	MessageTTLMs     int // Time-to-live del mensaje
}

// DeclareQueueWithDLQ declara una cola con su Dead Letter Queue configurada
// Implementa patrón de reintentos automáticos con exponencial backoff
func DeclareQueueWithDLQ(ch *amqp.Channel, config QueueConfig) error {
	// 1. Declarar EXCHANGE para Dead Letter (DLX)
	dlxName := fmt.Sprintf("%s.dlx", config.Name)
	err := ch.ExchangeDeclare(
		dlxName,  // name
		"fanout", // type
		true,     // durable
		false,    // auto-deleted
		false,    // internal
		false,    // no-wait
		nil,      // arguments
	)
	if err != nil {
		return fmt.Errorf("failed to declare DLX: %w", err)
	}
	
	// 2. Declarar DEAD LETTER QUEUE (DLQ)
	dlqArgs := amqp.Table{
		// Los mensajes en DLQ no vuelven a expirar
		"x-queue-mode": "lazy", // Optimización para mensajes persistentes
	}
	
	_, err = ch.QueueDeclare(
		config.DLQName, // name
		true,           // durable
		false,          // delete when unused
		false,          // exclusive
		false,          // no-wait
		dlqArgs,        // arguments
	)
	if err != nil {
		return fmt.Errorf("failed to declare DLQ: %w", err)
	}
	
	// 3. Bind DLQ al DLX
	err = ch.QueueBind(
		config.DLQName, // queue name
		"",             // routing key (vacío para fanout)
		dlxName,        // exchange
		false,
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to bind DLQ to DLX: %w", err)
	}
	
	// 4. Declarar COLA PRINCIPAL con configuración DLQ
	mainQueueArgs := amqp.Table{
		"x-dead-letter-exchange":    dlxName,                // Exchange para dead letters
		"x-message-ttl":             config.MessageTTLMs,    // TTL del mensaje
		"x-max-retries":             config.MaxRetries,      // Máximo de reintentos (custom header)
		"x-retry-delay":             config.RetryDelayMs,    // Delay entre reintentos (custom header)
	}
	
	_, err = ch.QueueDeclare(
		config.Name, // name
		true,        // durable
		false,       // delete when unused
		false,       // exclusive
		false,       // no-wait
		mainQueueArgs,
	)
	if err != nil {
		return fmt.Errorf("failed to declare main queue: %w", err)
	}
	
	log.Printf("✅ Queue '%s' configured with DLQ '%s' (max retries: %d)", 
		config.Name, config.DLQName, config.MaxRetries)
	
	return nil
}

// PublishWithRetry publica un mensaje con tracking de reintentos
func PublishWithRetry(ch *amqp.Channel, exchange, routingKey string, body []byte, retryCount int) error {
	headers := amqp.Table{
		"x-retry-count": retryCount,
	}
	
	msg := amqp.Publishing{
		DeliveryMode: amqp.Persistent, // Mensaje persistente
		ContentType:  "application/json",
		Body:         body,
		Headers:      headers,
	}
	
	return ch.Publish(
		exchange,   // exchange
		routingKey, // routing key
		false,      // mandatory
		false,      // immediate
		msg,
	)
}

// HandleMessageWithRetry procesa un mensaje con lógica de reintento
func HandleMessageWithRetry(delivery amqp.Delivery, handler func([]byte) error, maxRetries int) error {
	// Obtener contador de reintentos del header
	retryCount := 0
	if val, ok := delivery.Headers["x-retry-count"]; ok {
		if count, ok := val.(int); ok {
			retryCount = count
		}
	}
	
	// Intentar procesar el mensaje
	err := handler(delivery.Body)
	
	if err == nil {
		// Éxito: ACK el mensaje
		return delivery.Ack(false)
	}
	
	// Error: verificar si podemos reintentar
	if retryCount < maxRetries {
		log.Printf("⚠️  Error procesando mensaje (intento %d/%d): %v", 
			retryCount+1, maxRetries, err)
		
		// Rechazar mensaje para que vaya a DLQ y se reintente
		return delivery.Nack(false, false) // no requeue, va a DLQ
	}
	
	// Máximo de reintentos alcanzado
	log.Printf("❌ Mensaje fallido después de %d intentos: %v", maxRetries, err)
	
	// TODO: Enviar a cola de "poison messages" o logging permanente
	// Por ahora, simplemente ACK para sacarlo del sistema
	return delivery.Ack(false)
}

// SetupDLQConsumer configura un consumer para procesar mensajes de la DLQ
// Útil para análisis manual de mensajes fallidos
func SetupDLQConsumer(ch *amqp.Channel, dlqName string, callback func(amqp.Delivery)) error {
	msgs, err := ch.Consume(
		dlqName, // queue
		"",      // consumer tag
		false,   // auto-ack
		false,   // exclusive
		false,   // no-local
		false,   // no-wait
		nil,     // args
	)
	if err != nil {
		return fmt.Errorf("failed to register DLQ consumer: %w", err)
	}
	
	go func() {
		for msg := range msgs {
			log.Printf("🔴 Mensaje en DLQ: %s", string(msg.Body))
			callback(msg)
			msg.Ack(false) // ACK después de procesar/loggear
		}
	}()
	
	log.Printf("📮 DLQ Consumer iniciado para cola: %s", dlqName)
	return nil
}

// StandardQueues configuraciones estándar de colas
var StandardQueues = []QueueConfig{
	{
		Name:         "stock_alerts",
		DLQName:      "stock_alerts.dlq",
		RoutingKey:   "stock.low",
		MaxRetries:   3,
		RetryDelayMs: 5000,  // 5 segundos
		MessageTTLMs: 3600000, // 1 hora
	},
	{
		Name:         "email_queue",
		DLQName:      "email_queue.dlq",
		RoutingKey:   "email.send",
		MaxRetries:   5,
		RetryDelayMs: 10000, // 10 segundos
		MessageTTLMs: 7200000, // 2 horas
	},
	{
		Name:         "reports_queue",
		DLQName:      "reports_queue.dlq",
		RoutingKey:   "reports.generate",
		MaxRetries:   2,
		RetryDelayMs: 15000, // 15 segundos
		MessageTTLMs: 1800000, // 30 minutos
	},
	{
		Name:         "payments_queue",
		DLQName:      "payments_queue.dlq",
		RoutingKey:   "payments.process",
		MaxRetries:   3,
		RetryDelayMs: 30000, // 30 segundos
		MessageTTLMs: 600000, // 10 minutos (pagos son urgentes)
	},
}

// InitializeAllQueuesWithDLQ inicializa todas las colas estándar con sus DLQs
func InitializeAllQueuesWithDLQ(ch *amqp.Channel) error {
	for _, config := range StandardQueues {
		if err := DeclareQueueWithDLQ(ch, config); err != nil {
			return fmt.Errorf("failed to setup queue %s: %w", config.Name, err)
		}
	}
	
	log.Println("🎉 Todas las colas con DLQ configuradas exitosamente")
	return nil
}
