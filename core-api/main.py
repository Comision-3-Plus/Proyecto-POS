"""
Aplicación Principal - Nexus POS
FastAPI App con configuración Multi-Tenant
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware  # ⚡ OPTIMIZACIÓN: Compresión HTTP
from fastapi.exceptions import RequestValidationError, HTTPException
from sqlalchemy.exc import SQLAlchemyError
from contextlib import asynccontextmanager
from core.config import settings
from core.db import init_db
from core.logging_config import setup_logging
from core.middleware import RequestIDMiddleware, RequestLoggingMiddleware
from core.audit_middleware import AuditMiddleware
from core.exceptions import (
    NexusPOSException,
    nexus_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    sqlalchemy_exception_handler,
    generic_exception_handler
)
from api.routes import auth, productos, ventas, payments, insights, reportes, health, inventario, dashboard, exportar, admin, tiendas, caja, compras, sync, cache


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Ciclo de vida de la aplicación
    Ejecuta inicialización y limpieza
    """
    # Inicializar sistema de logging
    setup_logging(
        log_level="INFO",
        enable_console=True,
        enable_file=True,
        enable_json=False  # True para producción
    )
    
    
    logger = logging.getLogger(__name__)
    logger.info("=" * 50)
    logger.info(f"Iniciando {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info("=" * 50)
    
    # Startup: Crear tablas en desarrollo
    # En producción usar Alembic para migraciones
    try:
        await init_db()
        logger.info("Base de datos inicializada correctamente")
    except Exception as e:
        logger.warning(f"No se pudieron crear tablas (puede ser normal): {e}")
    
    yield
    
    # Shutdown: Limpiar recursos si es necesario
    logger.info("Cerrando aplicación...")


# Instancia de FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# ⚡ OPTIMIZACIÓN: GZip para comprimir respuestas (reduce payload 70-90%)
app.add_middleware(GZipMiddleware, minimum_size=1000)  # Comprimir respuestas > 1KB

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de Request ID, Logging y Auditoría
app.add_middleware(RequestIDMiddleware)
app.add_middleware(RequestLoggingMiddleware, log_body=False)
app.add_middleware(AuditMiddleware)  # ⭐ ENTERPRISE: Audit trails inmutables

# Registrar handlers de excepciones
app.add_exception_handler(NexusPOSException, nexus_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Registro de rutas
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(tiendas.router, prefix=settings.API_V1_STR)  # ⭐ NUEVO - Sistema Camaleón
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Admin"])  # ⭐ NUEVO
app.include_router(sync.router, prefix=settings.API_V1_STR)  # ⭐ MÓDULO 2 - Legacy Sync
app.include_router(cache.router, prefix=settings.API_V1_STR)  # ⭐ MÓDULO 3 - Redis Cache
app.include_router(productos.router, prefix=settings.API_V1_STR)
app.include_router(ventas.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)
app.include_router(insights.router, prefix=settings.API_V1_STR)
app.include_router(reportes.router, prefix=settings.API_V1_STR)
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(inventario.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(exportar.router, prefix=settings.API_V1_STR)
app.include_router(caja.router, prefix=settings.API_V1_STR)
app.include_router(compras.router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Nexus POS API",
        "version": settings.VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Endpoint de salud para monitoreo"""
    return {"status": "healthy"}
