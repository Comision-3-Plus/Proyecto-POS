package models

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Tienda representa una tienda/cliente en el sistema multi-tenant
type Tienda struct {
	ID        uuid.UUID `json:"id" db:"id"`
	Nombre    string    `json:"nombre" db:"nombre"`
	Rubro     string    `json:"rubro" db:"rubro"` // ropa, carniceria, ferreteria, etc.
	IsActive  bool      `json:"is_active" db:"is_active"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// TiendaModel encapsula operaciones de base de datos para tiendas
type TiendaModel struct {
	DB *pgxpool.Pool
}

// GetByID retorna una tienda por su UUID
func (m *TiendaModel) GetByID(tiendaID uuid.UUID) (*Tienda, error) {
	const query = `
		SELECT id, nombre, rubro, is_active, created_at
		FROM tiendas
		WHERE id = $1`

	var t Tienda
	err := m.DB.QueryRow(context.Background(), query, tiendaID).Scan(
		&t.ID, &t.Nombre, &t.Rubro, &t.IsActive, &t.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &t, nil
}

// GetAllActive retorna todas las tiendas activas
func (m *TiendaModel) GetAllActive() ([]Tienda, error) {
	const query = `
		SELECT id, nombre, rubro, is_active, created_at
		FROM tiendas
		WHERE is_active = true
		ORDER BY nombre ASC`

	rows, err := m.DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tiendas := []Tienda{}
	for rows.Next() {
		var t Tienda
		if err := rows.Scan(&t.ID, &t.Nombre, &t.Rubro, &t.IsActive, &t.CreatedAt); err != nil {
			return nil, err
		}
		tiendas = append(tiendas, t)
	}

	return tiendas, rows.Err()
}
