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
    
    # Base de Datos - OPCIONALES cuando DATABASE_URL está presente
    POSTGRES_SERVER: Optional[str] = None
    POSTGRES_USER: Optional[str] = None
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_DB: Optional[str] = None
    POSTGRES_PORT: int = 5432
    
    # SUPABASE: URLs separadas para APP vs MIGRACIONES
    DATABASE_URL: Optional[str] = None
    DATABASE_MIGRATION_URL: Optional[str] = None
    
    # Cola de Mensajes (RabbitMQ)
    RABBITMQ_URL: str = "amqp://user:pass@rabbitmq:5672/"
    
    # Cache (Redis)
    REDIS_URL: str = "redis://redis:6379/0"

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
    )
    
    def get_database_url(self) -> str:
        """Retorna la URL de base de datos para la APP (FastAPI)"""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        
        # Si no hay DATABASE_URL, los componentes son requeridos
        if not all([self.POSTGRES_USER, self.POSTGRES_PASSWORD, self.POSTGRES_SERVER, self.POSTGRES_DB]):
            raise ValueError(
                "DATABASE_URL o todos los componentes de Postgres deben estar configurados"
            )
        
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
    
    def get_migration_url(self) -> str:
        """Retorna la URL de base de datos para MIGRACIONES (Alembic)"""
        if self.DATABASE_MIGRATION_URL:
            return self.DATABASE_MIGRATION_URL
        
        return self.get_database_url()


settings = Settings()