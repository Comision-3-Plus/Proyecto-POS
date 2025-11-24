package reports

import (
	"bytes"
	"fmt"
	"strconv"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xuri/excelize/v2"

	"stock-in-order/worker/internal/models"
)

// GenerateProductsReport genera un reporte Excel de productos para una tienda
// ACTUALIZADO: Compatible con schema Python (UUID, multi-tenant)
// Retorna el archivo Excel como un slice de bytes
func GenerateProductsReport(db *pgxpool.Pool, tiendaID uuid.UUID) ([]byte, error) {
	// Obtener todos los productos de la tienda
	pm := &models.ProductoModel{DB: db}
	productos, err := pm.GetAllForTienda(tiendaID)
	if err != nil {
		return nil, fmt.Errorf("could not fetch productos: %w", err)
	}

	// Crear un nuevo archivo Excel en memoria
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			// Log error if needed
		}
	}()

	// Crear una nueva hoja llamada "Productos"
	sheetName := "Productos"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, fmt.Errorf("could not create Excel sheet: %w", err)
	}

	// Establecer la hoja activa
	f.SetActiveSheet(index)

	// Escribir cabeceras en la fila 1 (adaptado a schema Python)
	headers := []string{"ID", "Nombre", "SKU", "Descripción", "Stock", "Unidad", "Tipo", "Precio Venta", "Precio Costo", "Margen %", "Fecha Creación"}
	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, header)
	}

	// Escribir filas de datos (a partir de la fila 2)
	for rowIndex, producto := range productos {
		descripcion := ""
		if producto.Descripcion != nil {
			descripcion = *producto.Descripcion
		}

		// Calcular margen de ganancia
		margen := 0.0
		if producto.PrecioCosto > 0 {
			margen = ((producto.PrecioVenta - producto.PrecioCosto) / producto.PrecioCosto) * 100
		}

		row := rowIndex + 2 // Comenzar desde la fila 2

		f.SetCellValue(sheetName, "A"+strconv.Itoa(row), producto.ID.String())
		f.SetCellValue(sheetName, "B"+strconv.Itoa(row), producto.Nombre)
		f.SetCellValue(sheetName, "C"+strconv.Itoa(row), producto.SKU)
		f.SetCellValue(sheetName, "D"+strconv.Itoa(row), descripcion)
		f.SetCellValue(sheetName, "E"+strconv.Itoa(row), producto.StockActual)
		f.SetCellValue(sheetName, "F"+strconv.Itoa(row), producto.UnidadMedida)
		f.SetCellValue(sheetName, "G"+strconv.Itoa(row), producto.Tipo)
		f.SetCellValue(sheetName, "H"+strconv.Itoa(row), producto.PrecioVenta)
		f.SetCellValue(sheetName, "I"+strconv.Itoa(row), producto.PrecioCosto)
		f.SetCellValue(sheetName, "J"+strconv.Itoa(row), fmt.Sprintf("%.2f%%", margen))
		f.SetCellValue(sheetName, "K"+strconv.Itoa(row), producto.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	// Escribir el archivo Excel a un buffer en memoria
	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, fmt.Errorf("could not write Excel file: %w", err)
	}

	return buf.Bytes(), nil
}

// GenerateCustomersReport genera un reporte Excel de clientes para un usuario
func GenerateCustomersReport(db *pgxpool.Pool, userID int64) ([]byte, error) {
	cm := &models.CustomerModel{DB: db}
	customers, err := cm.GetAllForUser(userID)
	if err != nil {
		return nil, fmt.Errorf("could not fetch customers: %w", err)
	}

	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			// Log error if needed
		}
	}()

	sheetName := "Clientes"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, fmt.Errorf("could not create Excel sheet: %w", err)
	}

	f.SetActiveSheet(index)

	headers := []string{"ID", "Nombre", "Email", "Teléfono", "Dirección", "Fecha de Creación"}
	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, header)
	}

	for rowIndex, customer := range customers {
		row := rowIndex + 2

		f.SetCellValue(sheetName, "A"+strconv.Itoa(row), customer.ID)
		f.SetCellValue(sheetName, "B"+strconv.Itoa(row), customer.Name)
		f.SetCellValue(sheetName, "C"+strconv.Itoa(row), customer.Email)
		f.SetCellValue(sheetName, "D"+strconv.Itoa(row), customer.Phone)
		f.SetCellValue(sheetName, "E"+strconv.Itoa(row), customer.Address)
		f.SetCellValue(sheetName, "F"+strconv.Itoa(row), customer.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, fmt.Errorf("could not write Excel file: %w", err)
	}

	return buf.Bytes(), nil
}

// GenerateSuppliersReport genera un reporte Excel de proveedores para un usuario
func GenerateSuppliersReport(db *pgxpool.Pool, userID int64) ([]byte, error) {
	sm := &models.SupplierModel{DB: db}
	suppliers, err := sm.GetAllForUser(userID)
	if err != nil {
		return nil, fmt.Errorf("could not fetch suppliers: %w", err)
	}

	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			// Log error if needed
		}
	}()

	sheetName := "Proveedores"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, fmt.Errorf("could not create Excel sheet: %w", err)
	}

	f.SetActiveSheet(index)

	headers := []string{"ID", "Nombre", "Email", "Teléfono", "Dirección", "Fecha de Creación"}
	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, header)
	}

	for rowIndex, supplier := range suppliers {
		row := rowIndex + 2

		f.SetCellValue(sheetName, "A"+strconv.Itoa(row), supplier.ID)
		f.SetCellValue(sheetName, "B"+strconv.Itoa(row), supplier.Name)
		f.SetCellValue(sheetName, "C"+strconv.Itoa(row), supplier.Email)
		f.SetCellValue(sheetName, "D"+strconv.Itoa(row), supplier.Phone)
		f.SetCellValue(sheetName, "E"+strconv.Itoa(row), supplier.Address)
		f.SetCellValue(sheetName, "F"+strconv.Itoa(row), supplier.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, fmt.Errorf("could not write Excel file: %w", err)
	}

	return buf.Bytes(), nil
}
