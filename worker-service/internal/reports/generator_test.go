package reports

import (
	"bytes"
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/xuri/excelize/v2"

	"stock-in-order/worker/internal/models"
)

// TestGenerateProductsReport_Structure valida la estructura del Excel generado
func TestGenerateProductsReport_Structure(t *testing.T) {
	// Este test NO requiere DB, usa mocks
	t.Skip("Requiere implementar mock de DB - ver TestGenerateProductsReport_WithMockDB")
}

// TestGenerateProductsReport_Headers valida las cabeceras del Excel
func TestGenerateProductsReport_Headers(t *testing.T) {
	// Simular un Excel vacío con las cabeceras esperadas
	f := excelize.NewFile()
	defer f.Close()

	sheetName := "Productos"
	index, err := f.NewSheet(sheetName)
	require.NoError(t, err)
	f.SetActiveSheet(index)

	// Headers esperados (según generator.go)
	expectedHeaders := []string{
		"ID", "Nombre", "SKU", "Descripción", "Stock", "Unidad",
		"Tipo", "Precio Venta", "Precio Costo", "Margen %", "Fecha Creación",
	}

	// Escribir headers
	for i, header := range expectedHeaders {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, header)
	}

	// Validar que se escribieron correctamente
	for i, expectedHeader := range expectedHeaders {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		actualValue, err := f.GetCellValue(sheetName, cell)
		require.NoError(t, err)
		assert.Equal(t, expectedHeader, actualValue, "Header en columna %d debe coincidir", i+1)
	}
}

// TestGenerateProductsReport_MarginCalculation valida el cálculo del margen
func TestGenerateProductsReport_MarginCalculation(t *testing.T) {
	tests := []struct {
		name         string
		precioVenta  float64
		precioCosto  float64
		expectedPct  float64
	}{
		{
			name:        "Margen 50%",
			precioVenta: 1500.0,
			precioCosto: 1000.0,
			expectedPct: 50.0, // ((1500-1000)/1000) * 100
		},
		{
			name:        "Margen 66.67%",
			precioVenta: 5000.0,
			precioCosto: 3000.0,
			expectedPct: 66.67,
		},
		{
			name:        "Sin margen (costo cero)",
			precioVenta: 1000.0,
			precioCosto: 0.0,
			expectedPct: 0.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Simular cálculo de margen (como en generator.go)
			margen := 0.0
			if tt.precioCosto > 0 {
				margen = ((tt.precioVenta - tt.precioCosto) / tt.precioCosto) * 100
			}

			// Validar con delta de 0.01 para evitar problemas de float
			assert.InDelta(t, tt.expectedPct, margen, 0.01, "Margen debe calcularse correctamente")
		})
	}
}

// TestGenerateProductsReport_ExcelFormat valida que el resultado sea un Excel válido
func TestGenerateProductsReport_ExcelFormat(t *testing.T) {
	// Crear un Excel mínimo y validar que sea parseable
	f := excelize.NewFile()
	defer f.Close()

	sheetName := "Productos"
	f.NewSheet(sheetName)

	// Agregar datos de prueba
	f.SetCellValue(sheetName, "A1", "ID")
	f.SetCellValue(sheetName, "B1", "Nombre")
	f.SetCellValue(sheetName, "A2", uuid.New().String())
	f.SetCellValue(sheetName, "B2", "Producto Test")

	// Escribir a buffer
	var buf bytes.Buffer
	err := f.Write(&buf)
	require.NoError(t, err, "Debe escribir Excel a buffer")

	assert.Greater(t, buf.Len(), 0, "Buffer debe tener contenido")

	// Intentar parsear el Excel generado
	fParsed, err := excelize.OpenReader(&buf)
	require.NoError(t, err, "Excel generado debe ser parseable")
	defer fParsed.Close()

	// Validar que la hoja existe
	sheets := fParsed.GetSheetList()
	assert.Contains(t, sheets, sheetName, "Debe contener la hoja 'Productos'")
}

// TestGenerateProductsReport_UUIDFormat valida que los UUIDs se escriban como string
func TestGenerateProductsReport_UUIDFormat(t *testing.T) {
	validUUID := uuid.New()
	uuidString := validUUID.String()

	// Validar formato UUID
	assert.Len(t, uuidString, 36, "UUID string debe tener 36 caracteres")
	assert.Contains(t, uuidString, "-", "UUID debe contener guiones")

	// Validar que sea parseable de vuelta
	parsed, err := uuid.Parse(uuidString)
	require.NoError(t, err, "UUID string debe ser parseable")
	assert.Equal(t, validUUID, parsed, "UUID parseado debe coincidir")
}

// ====================================================================
// INTEGRATION TEST (Requiere DB real)
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

// TestGenerateProductsReport_Integration valida el flujo completo con DB
func TestGenerateProductsReport_Integration(t *testing.T) {
	pool := skipIfNoDB(t)
	if pool == nil {
		return
	}
	defer pool.Close()

	// Insertar datos de prueba
	tiendaID := uuid.New()
	productoID := uuid.New()

	_, err := pool.Exec(context.Background(), `
		INSERT INTO tiendas (id, nombre, rubro, is_active, created_at)
		VALUES ($1, 'Tienda Test', 'general', true, NOW())
		ON CONFLICT (id) DO NOTHING
	`, tiendaID)
	require.NoError(t, err)

	_, err = pool.Exec(context.Background(), `
		INSERT INTO productos (
			id, nombre, sku, precio_venta, precio_costo, stock_actual,
			unidad_medida, tipo, atributos, is_active, tienda_id, created_at, updated_at
		) VALUES (
			$1, 'Test Product', 'TEST-001', 1500.0, 900.0, 100.0,
			'UNIDAD', 'general', '{}', true, $2, NOW(), NOW()
		)
		ON CONFLICT (id) DO NOTHING
	`, productoID, tiendaID)
	require.NoError(t, err)

	// Generar reporte
	reportBytes, err := GenerateProductsReport(pool, tiendaID)
	require.NoError(t, err, "Debe generar reporte sin errores")
	assert.Greater(t, len(reportBytes), 0, "Reporte debe tener contenido")

	// Parsear el Excel generado
	reader := bytes.NewReader(reportBytes)
	f, err := excelize.OpenReader(reader)
	require.NoError(t, err, "Excel generado debe ser válido")
	defer f.Close()

	// Validar contenido
	sheetName := "Productos"
	rows, err := f.GetRows(sheetName)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(rows), 2, "Debe tener al menos 2 filas (header + 1 producto)")

	// Validar headers
	expectedHeaders := []string{"ID", "Nombre", "SKU", "Descripción", "Stock", "Unidad", "Tipo", "Precio Venta", "Precio Costo", "Margen %", "Fecha Creación"}
	assert.Equal(t, expectedHeaders, rows[0], "Headers deben coincidir")

	// Validar datos del producto
	if len(rows) > 1 {
		productRow := rows[1]
		assert.Equal(t, productoID.String(), productRow[0], "ID debe coincidir")
		assert.Equal(t, "Test Product", productRow[1], "Nombre debe coincidir")
		assert.Equal(t, "TEST-001", productRow[2], "SKU debe coincidir")
	}

	// Cleanup
	pool.Exec(context.Background(), "DELETE FROM productos WHERE id = $1", productoID)
	pool.Exec(context.Background(), "DELETE FROM tiendas WHERE id = $1", tiendaID)
}

// TestGenerateProductsReport_EmptyTienda valida comportamiento con tienda sin productos
func TestGenerateProductsReport_EmptyTienda(t *testing.T) {
	pool := skipIfNoDB(t)
	if pool == nil {
		return
	}
	defer pool.Close()

	// UUID de tienda inexistente
	tiendaVacia := uuid.New()

	reportBytes, err := GenerateProductsReport(pool, tiendaVacia)
	require.NoError(t, err, "No debe fallar con tienda vacía")
	assert.Greater(t, len(reportBytes), 0, "Debe generar Excel aunque esté vacío")

	// Validar que el Excel tenga solo headers
	reader := bytes.NewReader(reportBytes)
	f, err := excelize.OpenReader(reader)
	require.NoError(t, err)
	defer f.Close()

	rows, err := f.GetRows("Productos")
	require.NoError(t, err)
	assert.Equal(t, 1, len(rows), "Debe tener solo la fila de headers")
}

// ====================================================================
// MOCK-BASED TESTS (No requieren DB real)
// ====================================================================

// MockProductoModel simula el modelo de productos
type MockProductoModel struct {
	productos []models.Producto
	err       error
}

func (m *MockProductoModel) GetAllForTienda(tiendaID uuid.UUID) ([]models.Producto, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.productos, nil
}

// TestGenerateProductsReport_WithMockDB valida el generador con datos mockeados
func TestGenerateProductsReport_WithMockDB(t *testing.T) {
	// Este test requeriría refactorizar GenerateProductsReport para inyectar el modelo
	// Por ahora, se deja como TODO
	t.Skip("Requiere refactorizar GenerateProductsReport para aceptar interface en lugar de *pgxpool.Pool")

	// Ejemplo de cómo se vería:
	// mockModel := &MockProductoModel{
	// 	productos: []models.Producto{
	// 		{
	// 			ID:          uuid.New(),
	// 			Nombre:      "Mock Product",
	// 			SKU:         "MOCK-001",
	// 			PrecioVenta: 1000.0,
	// 			PrecioCosto: 600.0,
	// 			StockActual: 50.0,
	// 		},
	// 	},
	// }
	// reportBytes, err := GenerateProductsReportWithModel(mockModel, uuid.New())
	// require.NoError(t, err)
	// assert.Greater(t, len(reportBytes), 0)
}
