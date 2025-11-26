package rabbitmq

import (
	"fmt"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

// Consumer representa un consumidor de RabbitMQ con reconexión automática
type Consumer struct {
	conn           *amqp.Connection
	channel        *amqp.Channel
	queue          string
	amqpURI        string
	handler        func([]byte) error
	prefetchCount  int
	reconnectDelay time.Duration
	done           chan bool
}

// NewConsumer crea un nuevo consumidor de RabbitMQ
func NewConsumer(amqpURI, queueName string, handler func([]byte) error, prefetchCount int) (*Consumer, error) {
	c := &Consumer{
		queue:          queueName,
		amqpURI:        amqpURI,
		handler:        handler,
		prefetchCount:  prefetchCount,
		reconnectDelay: 5 * time.Second,
		done:           make(chan bool),
	}

	err := c.connect()
	if err != nil {
		return nil, fmt.Errorf("fallo inicial de conexión: %w", err)
	}

	return c, nil
}

// connect establece la conexión con RabbitMQ
func (c *Consumer) connect() error {
	var err error

	log.Printf("🔌 Conectando a RabbitMQ: %s", c.amqpURI)

	// Conectar a RabbitMQ
	c.conn, err = amqp.Dial(c.amqpURI)
	if err != nil {
		return fmt.Errorf("error conectando a RabbitMQ: %w", err)
	}

	// Abrir canal
	c.channel, err = c.conn.Channel()
	if err != nil {
		return fmt.Errorf("error abriendo canal: %w", err)
	}

	// Configurar QoS (Prefetch)
	err = c.channel.Qos(
		c.prefetchCount, // prefetch count
		0,               // prefetch size
		false,           // global
	)
	if err != nil {
		return fmt.Errorf("error configurando QoS: %w", err)
	}

	// Declarar exchange
	err = c.channel.ExchangeDeclare(
		"blend_events", // name
		"topic",        // type
		true,           // durable
		false,          // auto-deleted
		false,          // internal
		false,          // no-wait
		nil,            // arguments
	)
	if err != nil {
		return fmt.Errorf("error declarando exchange: %w", err)
	}

	// Declarar cola con DLQ
	_, err = c.channel.QueueDeclare(
		c.queue, // name
		true,    // durable (sobrevive reinicios)
		false,   // delete when unused
		false,   // exclusive
		false,   // no-wait
		amqp.Table{
			"x-dead-letter-exchange": "blend_events.dlx",
			"x-message-ttl":          86400000, // 24 horas
		},
	)
	if err != nil {
		return fmt.Errorf("error declarando cola: %w", err)
	}

	// Bind cola al exchange
	err = c.channel.QueueBind(
		c.queue,        // queue name
		"sales.created", // routing key
		"blend_events", // exchange
		false,
		nil,
	)
	if err != nil {
		return fmt.Errorf("error binding cola: %w", err)
	}

	log.Printf("✅ Conectado a RabbitMQ exitosamente")

	return nil
}

// Start inicia el consumo de mensajes
func (c *Consumer) Start() error {
	// Monitorear desconexiones
	notifyClose := c.conn.NotifyClose(make(chan *amqp.Error))

	go func() {
		for {
			select {
			case err := <-notifyClose:
				if err != nil {
					log.Printf("⚠️ Conexión cerrada: %v. Reconectando...", err)
					c.reconnect()
				}
			case <-c.done:
				log.Println("🛑 Cerrando consumidor...")
				return
			}
		}
	}()

	return c.consume()
}

// consume procesa los mensajes de la cola
func (c *Consumer) consume() error {
	msgs, err := c.channel.Consume(
		c.queue, // queue
		"",      // consumer tag
		false,   // auto-ack (IMPORTANTE: manual ack)
		false,   // exclusive
		false,   // no-local
		false,   // no-wait
		nil,     // args
	)
	if err != nil {
		return fmt.Errorf("error registrando consumidor: %w", err)
	}

	log.Printf("🎧 Escuchando eventos en cola [%s]... Esperando ventas.", c.queue)

	go func() {
		for d := range msgs {
			log.Printf("📥 Mensaje recibido: %s bytes", len(d.Body))

			// Ejecutar handler con retry logic
			err := c.processMessage(d.Body, d.DeliveryTag)

			if err != nil {
				log.Printf("❌ Error procesando mensaje: %v", err)
				// NACK sin requeue - irá a DLQ
				d.Nack(false, false)
			} else {
				// ACK - mensaje procesado exitosamente
				d.Ack(false)
				log.Println("✅ Mensaje procesado y confirmado")
			}
		}
	}()

	return nil
}

// processMessage procesa un mensaje con retry logic
func (c *Consumer) processMessage(body []byte, deliveryTag uint64) error {
	maxRetries := 3
	var lastErr error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		err := c.handler(body)
		if err == nil {
			return nil
		}

		lastErr = err
		log.Printf("⚠️ Intento %d/%d falló: %v", attempt, maxRetries, err)

		if attempt < maxRetries {
			// Backoff exponencial
			backoff := time.Duration(attempt*attempt) * time.Second
			log.Printf("🔄 Reintentando en %v...", backoff)
			time.Sleep(backoff)
		}
	}

	return fmt.Errorf("mensaje falló después de %d intentos: %w", maxRetries, lastErr)
}

// reconnect intenta reconectar al servidor RabbitMQ
func (c *Consumer) reconnect() {
	for {
		log.Printf("🔄 Intentando reconectar en %v...", c.reconnectDelay)
		time.Sleep(c.reconnectDelay)

		err := c.connect()
		if err != nil {
			log.Printf("❌ Reconexión fallida: %v", err)
			continue
		}

		err = c.consume()
		if err != nil {
			log.Printf("❌ Error al reiniciar consumo: %v", err)
			continue
		}

		log.Println("✅ Reconectado exitosamente")
		return
	}
}

// Close cierra la conexión
func (c *Consumer) Close() {
	close(c.done)

	if c.channel != nil {
		c.channel.Close()
	}

	if c.conn != nil {
		c.conn.Close()
	}

	log.Println("✅ Conexión cerrada")
}
