-- =====================================================
-- SCRIPT: mock_lince_data.sql
-- Propósito: Simular estructura arcaica de ERP viejo
-- Sistema Objetivo: Lince / Zoo Logic / Dragonfish
-- =====================================================

-- Crear la base de datos
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'LinceIndumentaria')
BEGIN
    CREATE DATABASE LinceIndumentaria;
END
GO

USE LinceIndumentaria;
GO

-- =====================================================
-- TABLA: STK_PRODUCTOS
-- Diseño arcaico típico de los 2000s
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'STK_PRODUCTOS')
BEGIN
    CREATE TABLE STK_PRODUCTOS (
        CODIGO varchar(50) PRIMARY KEY,           -- El SKU viejo
        DESCRIPCION varchar(200) NOT NULL,
        RUBRO varchar(50),
        PRECIO money NOT NULL,
        COSTO money NULL,                          -- A veces lo tienen, a veces no
        MARCA varchar(50) NULL,
        PROVEEDOR varchar(100) NULL,
        FECHA_MODIFICACION datetime DEFAULT GETDATE(),
        ACTIVO bit DEFAULT 1
    );
    
    PRINT '✅ Tabla STK_PRODUCTOS creada';
END
GO

-- =====================================================
-- TABLA: STK_SALDOS
-- Matriz separada de stock (diseño horrible pero común)
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'STK_SALDOS')
BEGIN
    CREATE TABLE STK_SALDOS (
        ID int IDENTITY(1,1) PRIMARY KEY,
        CODIGO varchar(50) NOT NULL,              -- FK a STK_PRODUCTOS
        TALLE varchar(10) NULL,                    -- Puede ser NULL para productos sin talle
        COLOR varchar(20) NULL,                    -- Puede ser NULL para productos sin color
        CANTIDAD decimal(10,2) NOT NULL DEFAULT 0, -- Puede ser decimal para pesables
        SUCURSAL varchar(10) NOT NULL DEFAULT 'PRINCIPAL',
        FECHA_ULTIMO_MOVIMIENTO datetime DEFAULT GETDATE(),
        USUARIO_MODIFICACION varchar(50) NULL,
        
        CONSTRAINT FK_SALDOS_PRODUCTOS FOREIGN KEY (CODIGO) 
            REFERENCES STK_PRODUCTOS(CODIGO)
    );
    
    -- Índice para performance del polling
    CREATE INDEX IX_SALDOS_FECHA ON STK_SALDOS(FECHA_ULTIMO_MOVIMIENTO);
    CREATE INDEX IX_SALDOS_CODIGO ON STK_SALDOS(CODIGO);
    
    PRINT '✅ Tabla STK_SALDOS creada';
END
GO

-- =====================================================
-- TABLA: VEN_COMPROBANTES (Opcional - para futuro)
-- Registro de ventas del sistema viejo
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VEN_COMPROBANTES')
BEGIN
    CREATE TABLE VEN_COMPROBANTES (
        NUMERO_COMPROBANTE int IDENTITY(1,1) PRIMARY KEY,
        TIPO_COMPROBANTE varchar(10) NOT NULL,    -- FC, NC, ND
        FECHA datetime DEFAULT GETDATE(),
        TOTAL money NOT NULL,
        METODO_PAGO varchar(20),                   -- EFECTIVO, TARJETA, etc.
        CLIENTE_DOCUMENTO varchar(20) NULL,
        SUCURSAL varchar(10) DEFAULT 'PRINCIPAL'
    );
    
    PRINT '✅ Tabla VEN_COMPROBANTES creada';
END
GO

-- =====================================================
-- DATOS SEMILLA (Basura inicial realista)
-- =====================================================

-- Limpiar datos anteriores si existen
DELETE FROM STK_SALDOS;
DELETE FROM STK_PRODUCTOS;
GO

-- Productos iniciales
PRINT '🌱 Insertando productos demo...';
INSERT INTO STK_PRODUCTOS (CODIGO, DESCRIPCION, RUBRO, PRECIO, COSTO, MARCA, PROVEEDOR) VALUES 
('REM-001', 'REMERA BASICA ALGODON', 'REMERAS', 15000, 9000, 'GENERICA', 'PROVEEDOR ABC'),
('REM-002', 'REMERA OVERSIZE ACID WASH', 'REMERAS', 25000, 15000, 'URBANA', 'PROVEEDOR XYZ'),
('JEAN-505', 'JEAN CLASICO RECTO', 'PANTALONES', 45000, 28000, 'LEVI''S', 'DISTRIBUIDORA DEL SUR'),
('JEAN-511', 'JEAN SLIM FIT', 'PANTALONES', 48000, 30000, 'LEVI''S', 'DISTRIBUIDORA DEL SUR'),
('BUZO-HOOD', 'BUZO CON CAPUCHA', 'BUZOS', 38000, 22000, 'NIKE', 'IMPORTADORA NORTE'),
('CAMP-BOMBER', 'CAMPERA BOMBER', 'CAMPERAS', 65000, 40000, 'ADIDAS', 'IMPORTADORA NORTE'),
('ZAP-RUN', 'ZAPATILLAS RUNNING', 'CALZADO', 85000, 55000, 'PUMA', 'CALZADOS SA'),
('GORRA-SNAP', 'GORRA SNAPBACK', 'ACCESORIOS', 8500, 5000, 'NEW ERA', 'PROVEEDOR ABC');
GO

-- Stock inicial con variantes (el caos realista)
PRINT '📦 Insertando stock inicial...';
INSERT INTO STK_SALDOS (CODIGO, TALLE, COLOR, CANTIDAD, SUCURSAL) VALUES
-- Remera básica
('REM-001', 'S', 'NEGRO', 10, 'PRINCIPAL'),
('REM-001', 'M', 'NEGRO', 15, 'PRINCIPAL'),
('REM-001', 'L', 'NEGRO', 12, 'PRINCIPAL'),
('REM-001', 'M', 'BLANCO', 8, 'PRINCIPAL'),
('REM-001', 'L', 'BLANCO', 5, 'PRINCIPAL'),

-- Remera oversize
('REM-002', 'M', 'NEGRO', 6, 'PRINCIPAL'),
('REM-002', 'L', 'GRIS', 4, 'PRINCIPAL'),

-- Jeans
('JEAN-505', '38', 'AZUL', 8, 'PRINCIPAL'),
('JEAN-505', '40', 'AZUL', 10, 'PRINCIPAL'),
('JEAN-505', '42', 'AZUL', 7, 'PRINCIPAL'),
('JEAN-511', '38', 'NEGRO', 5, 'PRINCIPAL'),
('JEAN-511', '40', 'NEGRO', 9, 'PRINCIPAL'),

-- Buzos
('BUZO-HOOD', 'M', 'NEGRO', 12, 'PRINCIPAL'),
('BUZO-HOOD', 'L', 'GRIS', 8, 'PRINCIPAL'),

-- Camperas
('CAMP-BOMBER', 'M', 'VERDE', 4, 'PRINCIPAL'),
('CAMP-BOMBER', 'L', 'NEGRO', 6, 'PRINCIPAL'),

-- Zapatillas
('ZAP-RUN', '39', 'BLANCO', 3, 'PRINCIPAL'),
('ZAP-RUN', '40', 'BLANCO', 5, 'PRINCIPAL'),
('ZAP-RUN', '41', 'NEGRO', 4, 'PRINCIPAL'),

-- Accesorios (sin talle/color)
('GORRA-SNAP', NULL, 'ROJO', 20, 'PRINCIPAL'),
('GORRA-SNAP', NULL, 'AZUL', 15, 'PRINCIPAL');
GO

PRINT '✅ Datos iniciales cargados exitosamente';
PRINT '';
PRINT '🎯 RESUMEN:';
PRINT '   - Base de datos: LinceIndumentaria';
PRINT '   - Productos: 8';
PRINT '   - Variantes en stock: 22';
PRINT '';
PRINT '🔧 SIGUIENTE PASO:';
PRINT '   Levantar el Legacy Agent (Go) para comenzar sincronización';
PRINT '';
GO

-- =====================================================
-- STORED PROCEDURE: Simular venta (para testing)
-- =====================================================
CREATE OR ALTER PROCEDURE sp_SimularVenta
    @Codigo varchar(50),
    @Talle varchar(10),
    @Color varchar(20),
    @Cantidad decimal(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Restar stock
    UPDATE STK_SALDOS
    SET CANTIDAD = CANTIDAD - @Cantidad,
        FECHA_ULTIMO_MOVIMIENTO = GETDATE(),
        USUARIO_MODIFICACION = 'CAJERO_SIM'
    WHERE CODIGO = @Codigo
      AND TALLE = @Talle
      AND COLOR = @Color;
    
    IF @@ROWCOUNT = 0
    BEGIN
        PRINT '❌ Variante no encontrada para descontar stock';
    END
    ELSE
    BEGIN
        PRINT '✅ Stock descontado correctamente';
        PRINT CONCAT('   SKU: ', @Codigo, ' | ', @Color, ' ', @Talle, ' | -', @Cantidad);
    END
END
GO

PRINT '✅ Stored Procedure sp_SimularVenta creada';
GO
