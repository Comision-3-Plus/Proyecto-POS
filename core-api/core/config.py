"""
Configuración de la aplicación - Nexus POS
Variables de entorno y settings globales
"""
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configuración centralizada del sistema
    Lee variables de entorno desde archivo .env
    """
    # Aplicación
    PROJECT_NAME: str = "Nexus POS API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Base de Datos
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: int = 5432
    
    # 🔥 SUPABASE: URLs separadas para APP vs MIGRACIONES
    # Si DATABASE_URL está definida directamente, usarla (Supabase)
    # Si no, construirla desde componentes (Docker local)
    DATABASE_URL: Optional[str] = None
    DATABASE_MIGRATION_URL: Optional[str] = None
    
    # === AGREGADO: Cola de Mensajes (RabbitMQ) ===
    RABBITMQ_URL: str = "amqp://user:pass@rabbitmq:5672/"
    # =============================================
    
    # === AGREGADO: Cache (Redis) - MÓDULO 3 ===
    REDIS_URL: str = "redis://redis:6379/0"
    # =========================================

    # Seguridad JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 días
    
    # CORS
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    @property
    def CORS_ORIGINS_LIST(self) -> list[str]:
        """Convierte BACKEND_CORS_ORIGINS de string a lista"""
        if isinstance(self.BACKEND_CORS_ORIGINS, str):
            return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]
        return self.BACKEND_CORS_ORIGINS
    
    # Mercado Pago
    MERCADOPAGO_ACCESS_TOKEN: Optional[str] = None
    MERCADOPAGO_WEBHOOK_SECRET: Optional[str] = None
    
    # AFIP (Facturación Electrónica)
    AFIP_CERT: Optional[str] = None
    AFIP_KEY: Optional[str] = None
    AFIP_CUIT: Optional[str] = None
    AFIP_PRODUCTION: bool = False  # False = Testing, True = Producción
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
        # Prioridad: Variables de entorno del sistema > .env
        # Esto permite que Docker sobrescriba .env
    )
    
    def get_database_url(self) -> str:
        """
        Retorna la URL de base de datos para la APP (FastAPI)
        
        Prioridad:
        1. DATABASE_URL del .env (Supabase con puerto 6543 pooler)
        2. Construcción desde componentes (Docker local)
        """
        if self.DATABASE_URL:
            return self.DATABASE_URL
        
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
    
    def get_migration_url(self) -> str:
        """
        Retorna la URL de base de datos para MIGRACIONES (Alembic)
        
        Prioridad:
        1. DATABASE_MIGRATION_URL del .env (Supabase con puerto 5432 directo)
        2. DATABASE_URL (fallback)
        3. Construcción desde componentes (Docker local)
        """
        if self.DATABASE_MIGRATION_URL:
            return self.DATABASE_MIGRATION_URL
        
        return self.get_database_url()


settings = Settings()