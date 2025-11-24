package alerts

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"stock-in-order/worker/internal/email"
	"stock-in-order/worker/internal/models"
)

// ProductAlert representa un producto con stock bajo (compatible con Python schema)
type ProductAlert struct {
	ID          uuid.UUID
	Nombre      string
	StockActual float64
	Threshold   float64
	TiendaEmail string
	TiendaNombre string
}

// CheckStockLevels chequea todos los productos con stock bajo y envía alertas
// ACTUALIZADO: Compatible con schema Python (tabla 'productos', UUID, multi-tenant)
func CheckStockLevels(db *pgxpool.Pool, emailClient *email.Client, threshold float64) error {
	log.Println("🔍 Chequeando niveles de stock...")

	// Query compatible con schema Python: productos (UUID), tiendas (multi-tenant)
	// NOTA: No existe campo 'notificado' en schema Python, se usa una tabla de auditoría separada
	query := `
		SELECT 
			p.id, 
			p.nombre, 
			p.stock_actual,
			t.nombre as tienda_nombre,
			COALESCE(
				(SELECT email FROM users WHERE tienda_id = t.id AND rol = 'owner' LIMIT 1),
				'admin@tienda.com'
			) as tienda_email
		FROM productos p
		INNER JOIN tiendas t ON p.tienda_id = t.id
		WHERE p.stock_actual < $1
		  AND p.is_active = true
		  AND p.tipo != 'servicio'
		  AND t.is_active = true
		ORDER BY p.stock_actual ASC
		LIMIT 50
	`

	rows, err := db.Query(context.Background(), query, threshold)
	if err != nil {
		return fmt.Errorf("error al ejecutar query de stock alerts: %w", err)
	}
	defer rows.Close()

	var alerts []ProductAlert
	for rows.Next() {
		var alert ProductAlert
		alert.Threshold = threshold
		
		err := rows.Scan(&alert.ID, &alert.Nombre, &alert.StockActual, &alert.TiendaNombre, &alert.TiendaEmail)
		if err != nil {
			log.Printf("❌ Error al escanear fila: %v", err)
			continue
		}
		alerts = append(alerts, alert)
	}

	if err := rows.Err(); err != nil {
		return fmt.Errorf("error al iterar sobre resultados: %w", err)
	}

	if len(alerts) == 0 {
		log.Println("✅ No hay productos con stock bajo. Todo está bajo control.")
		return nil
	}

	log.Printf("⚠️  Encontrados %d productos con stock bajo", len(alerts))

	// Procesar cada alerta
	for _, alert := range alerts {
		log.Printf("📧 Enviando alerta para producto: %s (Stock: %.2f < %.2f) de tienda '%s' a %s",
			alert.Nombre, alert.StockActual, alert.Threshold, alert.TiendaNombre, alert.TiendaEmail)

		// Enviar el email de alerta (adaptado a nuevos campos)
		if err := emailClient.SendStockAlertEmail(
			alert.TiendaEmail, 
			alert.Nombre, 
			int(alert.StockActual), 
			int(alert.Threshold),
		); err != nil {
			log.Printf("❌ Error al enviar email para producto ID %s: %v", alert.ID, err)
			continue
		}

		// TODO: Implementar tabla de auditoría 'stock_alerts_sent' para evitar envíos duplicados
		// Por ahora, confiamos en que el threshold dinámico evitará spam
		
		log.Printf("✅ Alerta enviada para: %s (Tienda: %s)", alert.Nombre, alert.TiendaNombre)
	}

	log.Printf("🎉 Proceso de alertas completado. %d alertas enviadas.", len(alerts))
	return nil
}
