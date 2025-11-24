package models

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Venta representa una transacción de venta completa
type Venta struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	Fecha       time.Time  `json:"fecha" db:"fecha"`
	Total       float64    `json:"total" db:"total"`
	MetodoPago  string     `json:"metodo_pago" db:"metodo_pago"` // efectivo, tarjeta_debito, tarjeta_credito, transferencia
	StatusPago  string     `json:"status_pago" db:"status_pago"` // pendiente, pagado, anulado
	PaymentID   *string    `json:"payment_id,omitempty" db:"payment_id"`
	AFIPCAE     *string    `json:"afip_cae,omitempty" db:"afip_cae"`
	AFIPCAEVto  *time.Time `json:"afip_cae_vto,omitempty" db:"afip_cae_vto"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	TiendaID    uuid.UUID  `json:"tienda_id" db:"tienda_id"`
}

// DetalleVenta representa un item individual dentro de una venta
type DetalleVenta struct {
	ID             uuid.UUID `json:"id" db:"id"`
	Cantidad       float64   `json:"cantidad" db:"cantidad"`
	PrecioUnitario float64   `json:"precio_unitario" db:"precio_unitario"`
	Subtotal       float64   `json:"subtotal" db:"subtotal"`
	VentaID        uuid.UUID `json:"venta_id" db:"venta_id"`
	ProductoID     uuid.UUID `json:"producto_id" db:"producto_id"`
}

// VentaModel encapsula operaciones de base de datos para ventas
type VentaModel struct {
	DB *pgxpool.Pool
}

// GetRecentSales retorna las últimas N ventas de una tienda
func (m *VentaModel) GetRecentSales(tiendaID uuid.UUID, limit int) ([]Venta, error) {
	const query = `
		SELECT 
			id, fecha, total, metodo_pago, status_pago,
			payment_id, afip_cae, afip_cae_vto, created_at, tienda_id
		FROM ventas
		WHERE tienda_id = $1
		ORDER BY fecha DESC
		LIMIT $2`

	rows, err := m.DB.Query(context.Background(), query, tiendaID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ventas := []Venta{}
	for rows.Next() {
		var v Venta
		err := rows.Scan(
			&v.ID, &v.Fecha, &v.Total, &v.MetodoPago, &v.StatusPago,
			&v.PaymentID, &v.AFIPCAE, &v.AFIPCAEVto, &v.CreatedAt, &v.TiendaID,
		)
		if err != nil {
			return nil, err
		}
		ventas = append(ventas, v)
	}

	return ventas, rows.Err()
}

// GetSalesByDateRange retorna ventas en un rango de fechas
func (m *VentaModel) GetSalesByDateRange(tiendaID uuid.UUID, desde, hasta time.Time) ([]Venta, error) {
	const query = `
		SELECT 
			id, fecha, total, metodo_pago, status_pago,
			payment_id, afip_cae, afip_cae_vto, created_at, tienda_id
		FROM ventas
		WHERE tienda_id = $1 
		  AND fecha >= $2 
		  AND fecha <= $3
		  AND status_pago != 'anulado'
		ORDER BY fecha DESC`

	rows, err := m.DB.Query(context.Background(), query, tiendaID, desde, hasta)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ventas := []Venta{}
	for rows.Next() {
		var v Venta
		err := rows.Scan(
			&v.ID, &v.Fecha, &v.Total, &v.MetodoPago, &v.StatusPago,
			&v.PaymentID, &v.AFIPCAE, &v.AFIPCAEVto, &v.CreatedAt, &v.TiendaID,
		)
		if err != nil {
			return nil, err
		}
		ventas = append(ventas, v)
	}

	return ventas, rows.Err()
}

// GetTotalSales calcula el total de ventas en un período
func (m *VentaModel) GetTotalSales(tiendaID uuid.UUID, desde, hasta time.Time) (float64, error) {
	const query = `
		SELECT COALESCE(SUM(total), 0) as total
		FROM ventas
		WHERE tienda_id = $1 
		  AND fecha >= $2 
		  AND fecha <= $3
		  AND status_pago = 'pagado'`

	var total float64
	err := m.DB.QueryRow(context.Background(), query, tiendaID, desde, hasta).Scan(&total)
	return total, err
}
