"""
OpenTelemetry Configuration
Configuración de observabilidad con traces, metrics y logs
"""
import logging
from typing import Optional
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from prometheus_client import start_http_server

from core.config import settings


logger = logging.getLogger(__name__)


class ObservabilityConfig:
    """
    Configuración centralizada de observabilidad
    """
    
    tracer_provider: Optional[TracerProvider] = None
    meter_provider: Optional[MeterProvider] = None
    
    @classmethod
    def setup(cls, app):
        """
        Configurar OpenTelemetry para la aplicación
        """
        logger.info("🔭 Configurando observabilidad...")
        
        # Crear resource (información del servicio)
        resource = Resource(attributes={
            SERVICE_NAME: settings.PROJECT_NAME,
            SERVICE_VERSION: settings.VERSION,
            "environment": settings.ENVIRONMENT,
        })
        
        # Setup Tracing
        cls._setup_tracing(resource, app)
        
        # Setup Metrics
        cls._setup_metrics(resource)
        
        logger.info("✅ Observabilidad configurada correctamente")
        logger.info(f"   - Jaeger UI: http://localhost:16686")
        logger.info(f"   - Prometheus: http://localhost:9090")
        logger.info(f"   - Metrics endpoint: http://localhost:8001/metrics")
    
    @classmethod
    def _setup_tracing(cls, resource: Resource, app):
        """Configurar distributed tracing con Jaeger"""
        
        # Crear Jaeger exporter
        jaeger_exporter = JaegerExporter(
            agent_host_name=settings.JAEGER_HOST,
            agent_port=settings.JAEGER_PORT,
        )
        
        # Crear tracer provider
        cls.tracer_provider = TracerProvider(resource=resource)
        
        # Agregar batch processor (envía spans en lotes)
        span_processor = BatchSpanProcessor(jaeger_exporter)
        cls.tracer_provider.add_span_processor(span_processor)
        
        # Setear como global
        trace.set_tracer_provider(cls.tracer_provider)
        
        # Instrumentar FastAPI
        FastAPIInstrumentor.instrument_app(app)
        
        # Instrumentar SQLAlchemy
        SQLAlchemyInstrumentor().instrument()
        
        # Instrumentar Redis
        RedisInstrumentor().instrument()
        
        # Instrumentar requests HTTP
        RequestsInstrumentor().instrument()
        
        logger.info("✅ Tracing configurado (Jaeger)")
    
    @classmethod
    def _setup_metrics(cls, resource: Resource):
        """Configurar métricas con Prometheus"""
        
        # Crear Prometheus metric reader
        prometheus_reader = PrometheusMetricReader()
        
        # Crear meter provider
        cls.meter_provider = MeterProvider(
            resource=resource,
            metric_readers=[prometheus_reader]
        )
        
        # Setear como global
        metrics.set_meter_provider(cls.meter_provider)
        
        # Iniciar servidor HTTP para Prometheus
        # Prometheus scrapeará http://localhost:8000/metrics
        start_http_server(port=8000, addr="0.0.0.0")
        
        logger.info("✅ Metrics configurados (Prometheus en :8000)")
    
    @classmethod
    def get_tracer(cls, name: str):
        """Obtener tracer para un módulo"""
        return trace.get_tracer(name)
    
    @classmethod
    def get_meter(cls, name: str):
        """Obtener meter para métricas"""
        return metrics.get_meter(name)


# =====================================================
# CUSTOM METRICS
# =====================================================

class NexusPOSMetrics:
    """
    Métricas de negocio personalizadas
    """
    
    def __init__(self):
        self.meter = ObservabilityConfig.get_meter(__name__)
        
        # Counter: Total de ventas
        self.ventas_counter = self.meter.create_counter(
            name="nexuspos.ventas.total",
            description="Total de ventas realizadas",
            unit="1"
        )
        
        # Counter: Total de productos vendidos
        self.productos_vendidos_counter = self.meter.create_counter(
            name="nexuspos.productos_vendidos.total",
            description="Total de productos vendidos",
            unit="1"
        )
        
        # Histogram: Tiempo de checkout
        self.checkout_duration = self.meter.create_histogram(
            name="nexuspos.checkout.duration",
            description="Duración del proceso de checkout",
            unit="ms"
        )
        
        # Histogram: Monto de ventas
        self.venta_amount = self.meter.create_histogram(
            name="nexuspos.venta.amount",
            description="Monto de cada venta",
            unit="ARS"
        )
        
        # UpDownCounter: Stock disponible
        self.stock_level = self.meter.create_up_down_counter(
            name="nexuspos.stock.level",
            description="Nivel de stock actual",
            unit="1"
        )
        
        # Counter: Errores AFIP
        self.afip_errors = self.meter.create_counter(
            name="nexuspos.afip.errors",
            description="Total de errores de AFIP",
            unit="1"
        )
    
    def record_venta(self, amount: float, tienda_id: str, metodo_pago: str):
        """Registrar una venta"""
        self.ventas_counter.add(1, {
            "tienda_id": tienda_id,
            "metodo_pago": metodo_pago
        })
        
        self.venta_amount.record(amount, {
            "tienda_id": tienda_id,
            "metodo_pago": metodo_pago
        })
    
    def record_producto_vendido(self, cantidad: int, producto_id: str, tienda_id: str):
        """Registrar productos vendidos"""
        self.productos_vendidos_counter.add(cantidad, {
            "producto_id": producto_id,
            "tienda_id": tienda_id
        })
    
    def record_checkout_duration(self, duration_ms: float, tienda_id: str):
        """Registrar duración de checkout"""
        self.checkout_duration.record(duration_ms, {
            "tienda_id": tienda_id
        })
    
    def update_stock(self, delta: int, producto_id: str, tienda_id: str):
        """Actualizar nivel de stock"""
        self.stock_level.add(delta, {
            "producto_id": producto_id,
            "tienda_id": tienda_id
        })
    
    def record_afip_error(self, error_type: str, tienda_id: str):
        """Registrar error de AFIP"""
        self.afip_errors.add(1, {
            "error_type": error_type,
            "tienda_id": tienda_id
        })


# Instancia global de métricas
nexuspos_metrics = NexusPOSMetrics()
