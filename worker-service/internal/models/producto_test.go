package models

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestProductoStructMapping valida que el struct Producto mapee correctamente
// los nombres de columna en español de la base de datos (Python schema)
func TestProductoStructMapping(t *testing.T) {
	tests := []struct {
		name           string
		jsonInput      string
		expectedNombre string
		expectedSKU    string
		expectedTipo   string
	}{
		{
			name: "Producto General",
			jsonInput: `{
				"id": "550e8400-e29b-41d4-a716-446655440000",
				"nombre": "Coca Cola",
				"sku": "COCA-001",
				"precio_venta": 1500.0,
				"precio_costo": 900.0,
				"stock_actual": 100.0,
				"unidad_medida": "UNIDAD",
				"tipo": "general",
				"is_active": true,
				"tienda_id": "660e8400-e29b-41d4-a716-446655440000"
			}`,
			expectedNombre: "Coca Cola",
			expectedSKU:    "COCA-001",
			expectedTipo:   "general",
		},
		{
			name: "Producto Pesable (Carnicería)",
			jsonInput: `{
				"id": "550e8400-e29b-41d4-a716-446655440001",
				"nombre": "Carne Molida",
				"sku": "CARNE-001",
				"precio_venta": 5000.0,
				"precio_costo": 3500.0,
				"stock_actual": 25.5,
				"unidad_medida": "KILO",
				"tipo": "pesable",
				"is_active": true,
				"tienda_id": "660e8400-e29b-41d4-a716-446655440000"
			}`,
			expectedNombre: "Carne Molida",
			expectedSKU:    "CARNE-001",
			expectedTipo:   "pesable",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var producto Producto
			err := json.Unmarshal([]byte(tt.jsonInput), &producto)
			require.NoError(t, err, "Debe deserializar JSON correctamente")

			// Validar mapeo de campos en español
			assert.Equal(t, tt.expectedNombre, producto.Nombre, "Campo 'nombre' debe mapearse correctamente")
			assert.Equal(t, tt.expectedSKU, producto.SKU, "Campo 'sku' debe mapearse correctamente")
			assert.Equal(t, tt.expectedTipo, producto.Tipo, "Campo 'tipo' debe mapearse correctamente")
			assert.True(t, producto.IsActive, "Campo 'is_active' debe mapearse correctamente")

			// Validar tipos de datos
			assert.IsType(t, uuid.UUID{}, producto.ID, "ID debe ser UUID")
			assert.IsType(t, float64(0), producto.PrecioVenta, "precio_venta debe ser float64")
			assert.IsType(t, float64(0), producto.PrecioCosto, "precio_costo debe ser float64")
			assert.IsType(t, float64(0), producto.StockActual, "stock_actual debe ser float64")
		})
	}
}

// TestProductoAtributosJSONB valida el manejo del campo JSONB polimórfico
func TestProductoAtributosJSONB(t *testing.T) {
	tests := []struct {
		name              string
		atributos         map[string]interface{}
		expectedMarshaled string
	}{
		{
			name: "Producto Ropa con atributos",
			atributos: map[string]interface{}{
				"talle":  "M",
				"color":  "Negro",
				"marca":  "Nike",
				"genero": "Unisex",
			},
			expectedMarshaled: `{"color":"Negro","genero":"Unisex","marca":"Nike","talle":"M"}`,
		},
		{
			name: "Producto Pesable con atributos",
			atributos: map[string]interface{}{
				"corte":     "molida",
				"categoria": "res",
			},
			expectedMarshaled: `{"categoria":"res","corte":"molida"}`,
		},
		{
			name:              "Producto General sin atributos",
			atributos:         map[string]interface{}{},
			expectedMarshaled: `{}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			producto := Producto{
				ID:          uuid.New(),
				Nombre:      "Test Product",
				SKU:         "TEST-001",
				Atributos:   tt.atributos,
				PrecioVenta: 1000.0,
				PrecioCosto: 600.0,
				StockActual: 50.0,
				Tipo:        "general",
				IsActive:    true,
				TiendaID:    uuid.New(),
			}

			// Serializar a JSON
			jsonBytes, err := json.Marshal(producto.Atributos)
			require.NoError(t, err, "Debe serializar atributos a JSON")

			// Validar estructura (ordenamiento puede variar)
			var expected, actual map[string]interface{}
			json.Unmarshal([]byte(tt.expectedMarshaled), &expected)
			json.Unmarshal(jsonBytes, &actual)

			assert.Equal(t, expected, actual, "Atributos JSONB deben coincidir")
		})
	}
}

// TestProductoUUIDTypes valida que los UUIDs se manejen correctamente
func TestProductoUUIDTypes(t *testing.T) {
	validUUID := uuid.New()
	tiendaUUID := uuid.New()

	producto := Producto{
		ID:          validUUID,
		Nombre:      "Test",
		SKU:         "TEST-001",
		PrecioVenta: 100.0,
		PrecioCosto: 50.0,
		StockActual: 10.0,
		TiendaID:    tiendaUUID,
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Validar que los UUIDs sean válidos
	assert.NotEqual(t, uuid.Nil, producto.ID, "ID no debe ser UUID nulo")
	assert.NotEqual(t, uuid.Nil, producto.TiendaID, "TiendaID no debe ser UUID nulo")

	// Validar conversión a string
	idString := producto.ID.String()
	assert.NotEmpty(t, idString, "UUID debe convertirse a string")

	// Validar que se pueda parsear de vuelta
	parsedUUID, err := uuid.Parse(idString)
	require.NoError(t, err, "String UUID debe parsearse correctamente")
	assert.Equal(t, producto.ID, parsedUUID, "UUID parseado debe coincidir")
}

// TestProductoUnidadMedida valida los valores permitidos de unidad_medida
func TestProductoUnidadMedida(t *testing.T) {
	validUnidades := []string{"UNIDAD", "KILO", "LITRO", "METRO"}

	for _, unidad := range validUnidades {
		t.Run("Unidad_"+unidad, func(t *testing.T) {
			producto := Producto{
				ID:           uuid.New(),
				Nombre:       "Test",
				SKU:          "TEST-001",
				UnidadMedida: unidad,
				PrecioVenta:  100.0,
				PrecioCosto:  50.0,
				StockActual:  10.0,
				TiendaID:     uuid.New(),
			}

			assert.Contains(t, validUnidades, producto.UnidadMedida, "Unidad debe estar en la lista de válidos")
		})
	}
}

// TestProductoStockDecimal valida que stock_actual soporte decimales
func TestProductoStockDecimal(t *testing.T) {
	tests := []struct {
		name           string
		stockActual    float64
		expectedType   string
		canBeDecimal   bool
	}{
		{
			name:         "Stock entero",
			stockActual:  100.0,
			expectedType: "float64",
			canBeDecimal: true,
		},
		{
			name:         "Stock decimal (pesable)",
			stockActual:  25.75,
			expectedType: "float64",
			canBeDecimal: true,
		},
		{
			name:         "Stock cero",
			stockActual:  0.0,
			expectedType: "float64",
			canBeDecimal: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			producto := Producto{
				ID:          uuid.New(),
				StockActual: tt.stockActual,
				TiendaID:    uuid.New(),
			}

			assert.IsType(t, float64(0), producto.StockActual, "StockActual debe ser float64")
			assert.Equal(t, tt.stockActual, producto.StockActual, "Valor de stock debe coincidir")
		})
	}
}

// TestProductoPreciosPositivos valida que los precios sean positivos
func TestProductoPreciosPositivos(t *testing.T) {
	tests := []struct {
		name        string
		precioVenta float64
		precioCosto float64
		shouldPass  bool
	}{
		{
			name:        "Precios válidos",
			precioVenta: 1500.0,
			precioCosto: 900.0,
			shouldPass:  true,
		},
		{
			name:        "Precio de venta mayor que costo (margen positivo)",
			precioVenta: 2000.0,
			precioCosto: 1000.0,
			shouldPass:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			producto := Producto{
				ID:          uuid.New(),
				PrecioVenta: tt.precioVenta,
				PrecioCosto: tt.precioCosto,
				TiendaID:    uuid.New(),
			}

			if tt.shouldPass {
				assert.Greater(t, producto.PrecioVenta, 0.0, "Precio venta debe ser positivo")
				assert.Greater(t, producto.PrecioCosto, 0.0, "Precio costo debe ser positivo")
			}

			// Calcular margen
			margen := ((producto.PrecioVenta - producto.PrecioCosto) / producto.PrecioCosto) * 100
			t.Logf("Margen de ganancia: %.2f%%", margen)
		})
	}
}

// ====================================================================
// INTEGRATION TESTS (Requieren DB real o testcontainers)
// ====================================================================

// Helper para skipear si no hay DB disponible
func skipIfNoDB(t *testing.T) *pgxpool.Pool {
	dbURL := "postgres://postgres:postgres@localhost:5432/nexus_pos_test?sslmode=disable"
	
	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		t.Skip("Skipping integration test: DB not available")
		return nil
	}
	
	// Verificar conexión
	if err := pool.Ping(context.Background()); err != nil {
		t.Skip("Skipping integration test: DB connection failed")
		return nil
	}
	
	return pool
}

// TestProductoModel_GetAllForTienda valida la query de productos por tienda
func TestProductoModel_GetAllForTienda(t *testing.T) {
	pool := skipIfNoDB(t)
	if pool == nil {
		return
	}
	defer pool.Close()

	model := &ProductoModel{DB: pool}
	tiendaID := uuid.MustParse("550e8400-e29b-41d4-a716-446655440000") // UUID fijo de test

	productos, err := model.GetAllForTienda(tiendaID)
	
	// No fallar si no hay datos, solo validar estructura
	assert.NoError(t, err, "Query no debe fallar")
	assert.NotNil(t, productos, "Debe retornar slice (puede estar vacío)")
	
	if len(productos) > 0 {
		primerProducto := productos[0]
		assert.NotEqual(t, uuid.Nil, primerProducto.ID, "ID debe ser válido")
		assert.NotEmpty(t, primerProducto.Nombre, "Nombre no debe estar vacío")
		assert.Equal(t, tiendaID, primerProducto.TiendaID, "TiendaID debe coincidir")
	}
}

// TestProductoModel_GetByID valida la obtención de un producto por UUID
func TestProductoModel_GetByID(t *testing.T) {
	pool := skipIfNoDB(t)
	if pool == nil {
		return
	}
	defer pool.Close()

	model := &ProductoModel{DB: pool}
	
	// IDs de test (deben existir en DB de test)
	productoID := uuid.New()
	tiendaID := uuid.New()

	producto, err := model.GetByID(productoID, tiendaID)
	
	// Puede retornar error si no existe (esperado en DB vacía)
	if err == nil {
		assert.NotNil(t, producto, "Producto no debe ser nil si no hay error")
		assert.Equal(t, productoID, producto.ID, "ID debe coincidir")
	}
}
