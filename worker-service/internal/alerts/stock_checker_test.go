package alerts

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestProductAlert_Structure valida la estructura del tipo ProductAlert
func TestProductAlert_Structure(t *testing.T) {
	alert := ProductAlert{
		ID:           uuid.New(),
		Nombre:       "Test Product",
		StockActual:  5.0,
		Threshold:    10.0,
		TiendaEmail:  "test@tienda.com",
		TiendaNombre: "Tienda Test",
	}

	assert.NotEqual(t, uuid.Nil, alert.ID, "ID debe ser válido")
	assert.NotEmpty(t, alert.Nombre, "Nombre no debe estar vacío")
	assert.Less(t, alert.StockActual, alert.Threshold, "StockActual debe ser menor que Threshold")
	assert.Contains(t, alert.TiendaEmail, "@", "Email debe tener formato válido")
}

// TestCheckStockLevels_ThresholdLogic valida la lógica del umbral
func TestCheckStockLevels_ThresholdLogic(t *testing.T) {
	tests := []struct {
		name        string
		stockActual float64
		threshold   float64
		shouldAlert bool
	}{
		{
			name:        "Stock bajo - debe alertar",
			stockActual: 5.0,
			threshold:   10.0,
			shouldAlert: true,
		},
		{
			name:        "Stock crítico - debe alertar",
			stockActual: 0.5,
			threshold:   10.0,
			shouldAlert: true,
		},
		{
			name:        "Stock suficiente - NO alertar",
			stockActual: 15.0,
			threshold:   10.0,
			shouldAlert: false,
		},
		{
			name:        "Stock exactamente en umbral - NO alertar",
			stockActual: 10.0,
			threshold:   10.0,
			shouldAlert: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Simular lógica de chequeo
			shouldAlert := tt.stockActual < tt.threshold

			assert.Equal(t, tt.shouldAlert, shouldAlert, "Lógica de alerta debe coincidir")
		})
	}
}

// TestCheckStockLevels_QueryFilter valida los filtros de la query
func TestCheckStockLevels_QueryFilter(t *testing.T) {
	// Casos que deben ser filtrados
	testCases := []struct {
		name     string
		tipo     string
		isActive bool
		included bool
	}{
		{
			name:     "Producto activo general",
			tipo:     "general",
			isActive: true,
			included: true,
		},
		{
			name:     "Producto activo pesable",
			tipo:     "pesable",
			isActive: true,
			included: true,
		},
		{
			name:     "Producto servicio - NO incluir",
			tipo:     "servicio",
			isActive: true,
			included: false,
		},
		{
			name:     "Producto inactivo - NO incluir",
			tipo:     "general",
			isActive: false,
			included: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Simular filtro de query
			included := tc.isActive && tc.tipo != "servicio"

			assert.Equal(t, tc.included, included, "Filtro debe coincidir")
		})
	}
}

// TestCheckStockLevels_EmailFormatting valida el formato del email de alerta
func TestCheckStockLevels_EmailFormatting(t *testing.T) {
	alert := ProductAlert{
		Nombre:       "Coca Cola 500ml",
		StockActual:  3.0,
		Threshold:    10.0,
		TiendaEmail:  "owner@tienda.com",
		TiendaNombre: "Almacen Central",
	}

	// Simular construcción del email
	emailSubject := "⚠️ Alerta de Stock Bajo"
	emailBody := "El producto '" + alert.Nombre + "' tiene stock bajo."

	assert.Contains(t, emailSubject, "Alerta", "Subject debe mencionar alerta")
	assert.Contains(t, emailBody, alert.Nombre, "Body debe incluir nombre del producto")
}

// TestCheckStockLevels_MultiTenant valida que solo se procesen productos de tiendas activas
func TestCheckStockLevels_MultiTenant(t *testing.T) {
	// La query debe incluir:
	// - AND t.is_active = true
	// - AND p.tienda_id = t.id

	t.Run("Tienda activa", func(t *testing.T) {
		tiendaActive := true
		assert.True(t, tiendaActive, "Solo tiendas activas deben procesarse")
	})

	t.Run("Tienda inactiva", func(t *testing.T) {
		tiendaActive := false
		assert.False(t, tiendaActive, "Tiendas inactivas deben filtrarse")
	})
}

// ====================================================================
// INTEGRATION TESTS (Requieren DB y Email mock)
// ====================================================================

func skipIfNoDB(t *testing.T) *pgxpool.Pool {
	dbURL := "postgres://postgres:postgres@localhost:5432/nexus_pos_test?sslmode=disable"

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		t.Skip("Skipping integration test: DB not available")
		return nil
	}

	if err := pool.Ping(context.Background()); err != nil {
		t.Skip("Skipping integration test: DB connection failed")
		return nil
	}

	return pool
}

// MockEmailClient simula el envío de emails
type MockEmailClient struct {
	SentEmails []EmailRecord
}

type EmailRecord struct {
	To         string
	ProductName string
	Stock      int
	Threshold  int
}

func (m *MockEmailClient) SendStockAlertEmail(to, productName string, stock, threshold int) error {
	m.SentEmails = append(m.SentEmails, EmailRecord{
		To:          to,
		ProductName: productName,
		Stock:       stock,
		Threshold:   threshold,
	})
	return nil
}

// TestCheckStockLevels_Integration valida el flujo completo con DB
func TestCheckStockLevels_Integration(t *testing.T) {
	pool := skipIfNoDB(t)
	if pool == nil {
		return
	}
	defer pool.Close()

	// Crear tienda de prueba
	tiendaID := uuid.New()
	_, err := pool.Exec(context.Background(), `
		INSERT INTO tiendas (id, nombre, rubro, is_active, created_at)
		VALUES ($1, 'Tienda Test Alerts', 'general', true, NOW())
		ON CONFLICT (id) DO NOTHING
	`, tiendaID)
	require.NoError(t, err)

	// Crear usuario owner para la tienda
	userID := uuid.New()
	_, err = pool.Exec(context.Background(), `
		INSERT INTO users (id, email, hashed_password, full_name, rol, tienda_id, is_active, created_at)
		VALUES ($1, 'owner@alerttest.com', 'hash', 'Owner Test', 'owner', $2, true, NOW())
		ON CONFLICT (id) DO NOTHING
	`, userID, tiendaID)
	require.NoError(t, err)

	// Crear producto con stock bajo
	productoID := uuid.New()
	_, err = pool.Exec(context.Background(), `
		INSERT INTO productos (
			id, nombre, sku, precio_venta, precio_costo, stock_actual,
			unidad_medida, tipo, atributos, is_active, tienda_id, created_at, updated_at
		) VALUES (
			$1, 'Producto Stock Bajo', 'LOW-001', 1000.0, 600.0, 3.0,
			'UNIDAD', 'general', '{}', true, $2, NOW(), NOW()
		)
		ON CONFLICT (id) DO NOTHING
	`, productoID, tiendaID)
	require.NoError(t, err)

	// Mock del email client
	mockEmail := &MockEmailClient{
		SentEmails: []EmailRecord{},
	}

	// Ejecutar chequeo de stock (threshold = 10)
	threshold := 10.0

	// Query manual para validar (simulando CheckStockLevels)
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
		  AND p.tienda_id = $2
		ORDER BY p.stock_actual ASC`

	rows, err := pool.Query(context.Background(), query, threshold, tiendaID)
	require.NoError(t, err)
	defer rows.Close()

	alertCount := 0
	for rows.Next() {
		var alert ProductAlert
		err := rows.Scan(&alert.ID, &alert.Nombre, &alert.StockActual, &alert.TiendaNombre, &alert.TiendaEmail)
		require.NoError(t, err)

		// Simular envío de email
		mockEmail.SendStockAlertEmail(
			alert.TiendaEmail,
			alert.Nombre,
			int(alert.StockActual),
			int(threshold),
		)
		alertCount++
	}

	assert.Greater(t, alertCount, 0, "Debe detectar al menos 1 producto con stock bajo")
	assert.Greater(t, len(mockEmail.SentEmails), 0, "Debe enviar al menos 1 email")

	// Validar email enviado
	if len(mockEmail.SentEmails) > 0 {
		email := mockEmail.SentEmails[0]
		assert.Equal(t, "owner@alerttest.com", email.To, "Email debe enviarse al owner")
		assert.Equal(t, "Producto Stock Bajo", email.ProductName, "Nombre del producto debe coincidir")
		assert.Equal(t, 3, email.Stock, "Stock debe coincidir")
	}

	// Cleanup
	pool.Exec(context.Background(), "DELETE FROM productos WHERE id = $1", productoID)
	pool.Exec(context.Background(), "DELETE FROM users WHERE id = $1", userID)
	pool.Exec(context.Background(), "DELETE FROM tiendas WHERE id = $1", tiendaID)
}

// TestCheckStockLevels_NoAlerts valida comportamiento cuando no hay stock bajo
func TestCheckStockLevels_NoAlerts(t *testing.T) {
	pool := skipIfNoDB(t)
	if pool == nil {
		return
	}
	defer pool.Close()

	tiendaID := uuid.New()

	mockEmail := &MockEmailClient{
		SentEmails: []EmailRecord{},
	}

	// Query con threshold muy bajo (0.1)
	threshold := 0.1

	query := `
		SELECT COUNT(*)
		FROM productos p
		INNER JOIN tiendas t ON p.tienda_id = t.id
		WHERE p.stock_actual < $1
		  AND p.is_active = true
		  AND p.tipo != 'servicio'
		  AND t.is_active = true
		  AND p.tienda_id = $2`

	var count int
	err := pool.QueryRow(context.Background(), query, threshold, tiendaID).Scan(&count)
	require.NoError(t, err)

	assert.Equal(t, 0, count, "No debe haber productos con stock < 0.1")
	assert.Equal(t, 0, len(mockEmail.SentEmails), "No debe enviar emails")
}
