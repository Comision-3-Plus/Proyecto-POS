package models

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Producto representa un producto de la tabla 'productos' (compatible con Python/SQLModel)
// CRÍTICO: Mapea EXACTAMENTE la estructura de core-api/models.py
type Producto struct {
	ID            uuid.UUID              `json:"id" db:"id"`
	Nombre        string                 `json:"nombre" db:"nombre"`
	SKU           string                 `json:"sku" db:"sku"`
	Descripcion   *string                `json:"descripcion,omitempty" db:"descripcion"`
	PrecioVenta   float64                `json:"precio_venta" db:"precio_venta"`
	PrecioCosto   float64                `json:"precio_costo" db:"precio_costo"`
	StockActual   float64                `json:"stock_actual" db:"stock_actual"`
	UnidadMedida  string                 `json:"unidad_medida" db:"unidad_medida"` // UNIDAD, KILO, LITRO, METRO
	Tipo          string                 `json:"tipo" db:"tipo"`                   // general, ropa, pesable, servicio
	Atributos     map[string]interface{} `json:"atributos" db:"atributos"`         // JSONB - Campos polimórficos
	IsActive      bool                   `json:"is_active" db:"is_active"`
	CreatedAt     time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time              `json:"updated_at" db:"updated_at"`
	TiendaID      uuid.UUID              `json:"tienda_id" db:"tienda_id"` // Multi-Tenant discriminator
}

// ProductoModel encapsula operaciones de base de datos para productos
type ProductoModel struct {
	DB *pgxpool.Pool
}

// GetAllForTienda retorna todos los productos activos de una tienda específica
// NOTA: Usa 'tienda_id' en lugar de 'user_id' para correcta separación multi-tenant
func (m *ProductoModel) GetAllForTienda(tiendaID uuid.UUID) ([]Producto, error) {
	const query = `
		SELECT 
			id, nombre, sku, descripcion, precio_venta, precio_costo,
			stock_actual, unidad_medida, tipo, atributos, is_active,
			created_at, updated_at, tienda_id
		FROM productos
		WHERE tienda_id = $1 AND is_active = true
		ORDER BY nombre ASC`

	rows, err := m.DB.Query(context.Background(), query, tiendaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	productos := []Producto{}
	for rows.Next() {
		var p Producto
		var atributosJSON []byte

		err := rows.Scan(
			&p.ID, &p.Nombre, &p.SKU, &p.Descripcion,
			&p.PrecioVenta, &p.PrecioCosto, &p.StockActual,
			&p.UnidadMedida, &p.Tipo, &atributosJSON, &p.IsActive,
			&p.CreatedAt, &p.UpdatedAt, &p.TiendaID,
		)
		if err != nil {
			return nil, err
		}

		// Deserializar JSONB
		if atributosJSON != nil {
			if err := json.Unmarshal(atributosJSON, &p.Atributos); err != nil {
				return nil, err
			}
		}

		productos = append(productos, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return productos, nil
}

// GetByID retorna un producto por su UUID (con validación multi-tenant)
func (m *ProductoModel) GetByID(productoID, tiendaID uuid.UUID) (*Producto, error) {
	const query = `
		SELECT 
			id, nombre, sku, descripcion, precio_venta, precio_costo,
			stock_actual, unidad_medida, tipo, atributos, is_active,
			created_at, updated_at, tienda_id
		FROM productos
		WHERE id = $1 AND tienda_id = $2`

	var p Producto
	var atributosJSON []byte

	err := m.DB.QueryRow(context.Background(), query, productoID, tiendaID).Scan(
		&p.ID, &p.Nombre, &p.SKU, &p.Descripcion,
		&p.PrecioVenta, &p.PrecioCosto, &p.StockActual,
		&p.UnidadMedida, &p.Tipo, &atributosJSON, &p.IsActive,
		&p.CreatedAt, &p.UpdatedAt, &p.TiendaID,
	)
	if err != nil {
		return nil, err
	}

	if atributosJSON != nil {
		if err := json.Unmarshal(atributosJSON, &p.Atributos); err != nil {
			return nil, err
		}
	}

	return &p, nil
}

// GetLowStockProducts retorna productos con stock bajo el umbral (para alertas)
func (m *ProductoModel) GetLowStockProducts(tiendaID uuid.UUID, threshold float64) ([]Producto, error) {
	const query = `
		SELECT 
			id, nombre, sku, descripcion, precio_venta, precio_costo,
			stock_actual, unidad_medida, tipo, atributos, is_active,
			created_at, updated_at, tienda_id
		FROM productos
		WHERE tienda_id = $1 
		  AND is_active = true
		  AND stock_actual < $2
		  AND tipo != 'servicio'
		ORDER BY stock_actual ASC`

	rows, err := m.DB.Query(context.Background(), query, tiendaID, threshold)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	productos := []Producto{}
	for rows.Next() {
		var p Producto
		var atributosJSON []byte

		err := rows.Scan(
			&p.ID, &p.Nombre, &p.SKU, &p.Descripcion,
			&p.PrecioVenta, &p.PrecioCosto, &p.StockActual,
			&p.UnidadMedida, &p.Tipo, &atributosJSON, &p.IsActive,
			&p.CreatedAt, &p.UpdatedAt, &p.TiendaID,
		)
		if err != nil {
			return nil, err
		}

		if atributosJSON != nil {
			if err := json.Unmarshal(atributosJSON, &p.Atributos); err != nil {
				return nil, err
			}
		}

		productos = append(productos, p)
	}

	return productos, rows.Err()
}

// UpdateStock actualiza el stock de un producto (READ/WRITE permitido)
// NOTA: Go NO ejecuta migraciones (DDL), solo operaciones DML
func (m *ProductoModel) UpdateStock(productoID, tiendaID uuid.UUID, nuevoStock float64) error {
	const query = `
		UPDATE productos
		SET stock_actual = $1, updated_at = NOW()
		WHERE id = $2 AND tienda_id = $3`

	_, err := m.DB.Exec(context.Background(), query, nuevoStock, productoID, tiendaID)
	return err
}
