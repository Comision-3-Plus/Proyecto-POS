"""
Tests de integración - Flujo completo de Venta
CRÍTICO: Valida que el mensaje enviado a RabbitMQ tenga la estructura EXACTA
que espera el Worker de Go.
"""
import pytest
import pytest_asyncio
import json
from uuid import UUID
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from models import Producto, Venta, DetalleVenta, Tienda, User
from sqlmodel import select


class TestFullSalesFlow:
    """
    Tests de flujo completo: Frontend → API → DB → RabbitMQ → Worker Go
    """
    
    @pytest.mark.asyncio
    async def test_venta_completa_con_rabbitmq_event(
        self,
        client: AsyncClient,
        session: AsyncSession,
        tienda_test: Tienda,
        user_owner: User,
        producto_general: Producto,
        auth_headers_owner: dict,
        mock_rabbitmq: list
    ):
        """
        FLUJO COMPLETO DE VENTA
        1. Crea una venta por API
        2. Verifica que se guardó en DB
        3. Valida que el mensaje publicado en RabbitMQ tiene la estructura correcta
        """
        # PASO 1: Crear venta
        venta_payload = {
            "items": [
                {
                    "producto_id": str(producto_general.id),
                    "cantidad": 3
                }
            ],
            "metodo_pago": "efectivo"
        }
        
        response = await client.post(
            "/api/v1/ventas/checkout",
            json=venta_payload,
            headers=auth_headers_owner
        )
        
        assert response.status_code == 201
        data = response.json()
        
        # PASO 2: Validar respuesta de la API
        assert "venta_id" in data
        assert data["total"] == 4500.0  # 3 * 1500
        assert data["metodo_pago"] == "efectivo"
        assert data["cantidad_items"] == 1
        
        venta_id = data["venta_id"]
        
        # PASO 3: Verificar que se guardó en la BD
        statement = select(Venta).where(Venta.id == UUID(venta_id))
        result = await session.execute(statement)
        venta_db = result.scalar_one_or_none()
        
        assert venta_db is not None
        assert venta_db.total == 4500.0
        assert venta_db.tienda_id == tienda_test.id
        
        # Verificar detalles de venta
        statement_detalles = select(DetalleVenta).where(DetalleVenta.venta_id == venta_db.id)
        result_detalles = await session.execute(statement_detalles)
        detalles = result_detalles.scalars().all()
        
        assert len(detalles) == 1
        assert detalles[0].cantidad == 3
        assert detalles[0].precio_unitario == 1500.0
        
        # Verificar descuento de stock
        await session.refresh(producto_general)
        assert producto_general.stock_actual == 97.0  # 100 - 3
        
        # PASO 4: VALIDAR MENSAJE RABBITMQ (CRÍTICO PARA INTEGRACIÓN GO)
        assert len(mock_rabbitmq) == 1, "Debe haberse publicado 1 evento"
        
        event = mock_rabbitmq[0]
        
        # Validar routing key
        assert event["routing_key"] == "ventas_procesadas"
        
        # Validar estructura del mensaje
        message = event["data"]
        
        # ====================================================================
        # 🔍 CONTRATO JSON ESPERADO POR EL WORKER DE GO
        # ====================================================================
        assert "evento" in message
        assert message["evento"] == "NUEVA_VENTA"
        
        assert "venta_id" in message
        assert message["venta_id"] == venta_id
        
        assert "tienda_id" in message
        assert message["tienda_id"] == str(tienda_test.id)
        
        assert "total" in message
        assert isinstance(message["total"], (int, float))
        assert message["total"] == 4500.0
        
        assert "metodo_pago" in message
        assert message["metodo_pago"] == "efectivo"
        
        assert "items_count" in message
        assert message["items_count"] == 1
        
        # Validar tipos de datos (Go es estricto con tipos)
        assert isinstance(UUID(message["venta_id"]), UUID), "venta_id debe ser UUID válido"
        assert isinstance(UUID(message["tienda_id"]), UUID), "tienda_id debe ser UUID válido"
        assert isinstance(message["total"], (int, float)), "total debe ser numérico"
        assert isinstance(message["items_count"], int), "items_count debe ser entero"
        
        # Validar metadata de trazabilidad
        assert "_source" in message
        assert message["_source"] == "nexus_pos_api"
        
        print("✅ Contrato JSON validado correctamente para Worker Go")
    
    @pytest.mark.asyncio
    async def test_venta_con_multiples_productos(
        self,
        client: AsyncClient,
        session: AsyncSession,
        tienda_test: Tienda,
        producto_general: Producto,
        producto_pesable: Producto,
        auth_headers_owner: dict,
        mock_rabbitmq: list
    ):
        """
        Venta con múltiples productos (uno unitario y uno pesable)
        """
        venta_payload = {
            "items": [
                {
                    "producto_id": str(producto_general.id),
                    "cantidad": 2
                },
                {
                    "producto_id": str(producto_pesable.id),
                    "cantidad": 1.5  # 1.5 kilos
                }
            ],
            "metodo_pago": "tarjeta_debito"
        }
        
        response = await client.post(
            "/api/v1/ventas/checkout",
            json=venta_payload,
            headers=auth_headers_owner
        )
        
        assert response.status_code == 201
        data = response.json()
        
        # Total: (2 * 1500) + (1.5 * 5000) = 3000 + 7500 = 10500
        assert data["total"] == 10500.0
        assert data["cantidad_items"] == 2
        
        # Validar mensaje RabbitMQ
        assert len(mock_rabbitmq) == 1
        event = mock_rabbitmq[0]
        
        assert event["data"]["items_count"] == 2
        assert event["data"]["metodo_pago"] == "tarjeta_debito"
    
    @pytest.mark.asyncio
    async def test_venta_falla_por_stock_insuficiente(
        self,
        client: AsyncClient,
        session: AsyncSession,
        producto_general: Producto,
        auth_headers_owner: dict,
        mock_rabbitmq: list
    ):
        """
        Debe fallar cuando no hay stock suficiente y NO publicar evento
        """
        # Intentar vender más de lo disponible
        venta_payload = {
            "items": [
                {
                    "producto_id": str(producto_general.id),
                    "cantidad": 150  # Stock actual: 100
                }
            ],
            "metodo_pago": "efectivo"
        }
        
        response = await client.post(
            "/api/v1/ventas/checkout",
            json=venta_payload,
            headers=auth_headers_owner
        )
        
        assert response.status_code == 400
        error_data = response.json()
        assert "Stock insuficiente" in error_data["detail"]
        
        # NO debe haberse publicado evento a RabbitMQ
        assert len(mock_rabbitmq) == 0
        
        # Verificar que el stock NO cambió
        await session.refresh(producto_general)
        assert producto_general.stock_actual == 100.0
    
    @pytest.mark.asyncio
    async def test_venta_falla_producto_inactivo(
        self,
        client: AsyncClient,
        session: AsyncSession,
        producto_general: Producto,
        auth_headers_owner: dict,
        mock_rabbitmq: list
    ):
        """
        Debe fallar si el producto está inactivo
        """
        # Desactivar producto
        producto_general.is_active = False
        session.add(producto_general)
        await session.commit()
        
        venta_payload = {
            "items": [
                {
                    "producto_id": str(producto_general.id),
                    "cantidad": 1
                }
            ],
            "metodo_pago": "efectivo"
        }
        
        response = await client.post(
            "/api/v1/ventas/checkout",
            json=venta_payload,
            headers=auth_headers_owner
        )
        
        assert response.status_code == 400
        assert "inactivo" in response.json()["detail"]
        
        # NO debe haberse publicado evento
        assert len(mock_rabbitmq) == 0


class TestVentaJSONSchemaContract:
    """
    Tests específicos para validar el contrato JSON con el Worker Go
    """
    
    @pytest.mark.asyncio
    async def test_rabbitmq_message_schema_validation(
        self,
        client: AsyncClient,
        producto_general: Producto,
        auth_headers_owner: dict,
        mock_rabbitmq: list
    ):
        """
        Valida que el mensaje cumpla con el JSON Schema esperado por Go
        
        Go Consumer espera:
        {
            "evento": "NUEVA_VENTA",
            "venta_id": "uuid-string",
            "tienda_id": "uuid-string",
            "total": float64,
            "metodo_pago": string,
            "items_count": int
        }
        """
        venta_payload = {
            "items": [{"producto_id": str(producto_general.id), "cantidad": 1}],
            "metodo_pago": "efectivo"
        }
        
        await client.post(
            "/api/v1/ventas/checkout",
            json=venta_payload,
            headers=auth_headers_owner
        )
        
        assert len(mock_rabbitmq) == 1
        message = mock_rabbitmq[0]["data"]
        
        # Schema validation
        required_fields = [
            "evento",
            "venta_id",
            "tienda_id",
            "total",
            "metodo_pago",
            "items_count"
        ]
        
        for field in required_fields:
            assert field in message, f"Campo requerido '{field}' no está en el mensaje"
        
        # Type validation
        assert isinstance(message["evento"], str)
        assert isinstance(message["venta_id"], str)
        assert isinstance(message["tienda_id"], str)
        assert isinstance(message["total"], (int, float))
        assert isinstance(message["metodo_pago"], str)
        assert isinstance(message["items_count"], int)
        
        # UUID format validation
        try:
            UUID(message["venta_id"])
            UUID(message["tienda_id"])
        except ValueError:
            pytest.fail("venta_id o tienda_id no son UUIDs válidos")
        
        # Value validation
        assert message["evento"] in ["NUEVA_VENTA", "VENTA_ANULADA"]
        assert message["metodo_pago"] in ["efectivo", "tarjeta_debito", "tarjeta_credito", "transferencia"]
        assert message["total"] > 0
        assert message["items_count"] > 0
        
        print("✅ JSON Schema validado para Worker Go")
