"""
Circuit Breaker Pattern - Protección para APIs Externas
Implementa resiliencia automática con fallback graceful
"""
import time
import logging
from typing import Callable, Any, Optional
from enum import Enum
from dataclasses import dataclass, field
from functools import wraps


logger = logging.getLogger(__name__)


class CircuitState(str, Enum):
    """Estados del Circuit Breaker"""
    CLOSED = "closed"       # Funcionando normalmente
    OPEN = "open"           # Circuit abierto, fallando
    HALF_OPEN = "half_open" # Probando recuperación


@dataclass
class CircuitBreakerConfig:
    """Configuración del Circuit Breaker"""
    failure_threshold: int = 5          # Fallos antes de abrir
    success_threshold: int = 2          # Éxitos para cerrar desde half-open
    timeout: int = 60                   # Segundos antes de probar half-open
    expected_exception: type = Exception


@dataclass
class CircuitBreakerStats:
    """Estadísticas del Circuit Breaker"""
    state: CircuitState = CircuitState.CLOSED
    failure_count: int = 0
    success_count: int = 0
    last_failure_time: Optional[float] = None
    total_requests: int = 0
    total_failures: int = 0
    total_successes: int = 0


class CircuitBreakerOpenException(Exception):
    """Excepción lanzada cuando el circuit está abierto"""
    pass


class CircuitBreaker:
    """
    Circuit Breaker para proteger llamadas a servicios externos
    
    Estados:
    - CLOSED: Funcionando normalmente, todas las llamadas pasan
    - OPEN: Demasiados fallos, todas las llamadas fallan inmediatamente
    - HALF_OPEN: Probando recuperación, permite algunas llamadas
    
    Uso:
        cb = CircuitBreaker(
            name="MercadoPago",
            failure_threshold=5,
            timeout=60
        )
        
        @cb.call
        def payment_api():
            return mercadopago.process_payment()
    """
    
    def __init__(self, name: str, config: Optional[CircuitBreakerConfig] = None):
        self.name = name
        self.config = config or CircuitBreakerConfig()
        self.stats = CircuitBreakerStats()
    
    def _should_attempt_reset(self) -> bool:
        """Verifica si es momento de intentar cerrar el circuit"""
        if self.stats.state != CircuitState.OPEN:
            return False
        
        if self.stats.last_failure_time is None:
            return False
        
        time_since_failure = time.time() - self.stats.last_failure_time
        return time_since_failure >= self.config.timeout
    
    def _record_success(self):
        """Registra un llamado exitoso"""
        self.stats.success_count += 1
        self.stats.total_successes += 1
        self.stats.failure_count = 0  # Reset contador de fallos
        
        if self.stats.state == CircuitState.HALF_OPEN:
            if self.stats.success_count >= self.config.success_threshold:
                self._close_circuit()
    
    def _record_failure(self):
        """Registra un llamado fallido"""
        self.stats.failure_count += 1
        self.stats.total_failures += 1
        self.stats.success_count = 0  # Reset contador de éxitos
        self.stats.last_failure_time = time.time()
        
        if self.stats.failure_count >= self.config.failure_threshold:
            self._open_circuit()
    
    def _open_circuit(self):
        """Abre el circuit (todas las llamadas fallan)"""
        self.stats.state = CircuitState.OPEN
        logger.warning(
            f"🔴 Circuit Breaker '{self.name}' ABIERTO. "
            f"Fallos consecutivos: {self.stats.failure_count}. "
            f"Reintentará en {self.config.timeout}s"
        )
    
    def _close_circuit(self):
        """Cierra el circuit (funcionamiento normal)"""
        self.stats.state = CircuitState.CLOSED
        self.stats.failure_count = 0
        self.stats.success_count = 0
        logger.info(f"🟢 Circuit Breaker '{self.name}' CERRADO. Servicio recuperado.")
    
    def _half_open_circuit(self):
        """Pone el circuit en estado half-open (probando)"""
        self.stats.state = CircuitState.HALF_OPEN
        self.stats.success_count = 0
        logger.info(f"🟡 Circuit Breaker '{self.name}' HALF-OPEN. Probando recuperación...")
    
    def call(self, func: Callable, *args, fallback: Optional[Callable] = None, **kwargs) -> Any:
        """
        Ejecuta una función protegida por el circuit breaker
        
        Args:
            func: Función a ejecutar
            *args, **kwargs: Argumentos de la función
            fallback: Función de fallback si el circuit está abierto
        
        Returns:
            Resultado de func() o fallback()
        
        Raises:
            CircuitBreakerOpenException: Si el circuit está abierto y no hay fallback
        """
        self.stats.total_requests += 1
        
        # Verificar si debemos intentar resetear
        if self._should_attempt_reset():
            self._half_open_circuit()
        
        # Si el circuit está abierto, usar fallback o fallar
        if self.stats.state == CircuitState.OPEN:
            logger.warning(
                f"⚠️ Circuit Breaker '{self.name}' está ABIERTO. "
                f"Llamada bloqueada. Total fallos: {self.stats.total_failures}"
            )
            
            if fallback:
                logger.info(f"🔄 Usando fallback para '{self.name}'")
                return fallback(*args, **kwargs)
            
            raise CircuitBreakerOpenException(
                f"Circuit breaker '{self.name}' está abierto. "
                f"El servicio está temporalmente no disponible."
            )
        
        # Intentar ejecutar la función
        try:
            result = func(*args, **kwargs)
            self._record_success()
            return result
        
        except self.config.expected_exception as e:
            self._record_failure()
            logger.error(f"❌ Fallo en '{self.name}': {str(e)}")
            
            # Si hay fallback, usarlo
            if fallback:
                logger.info(f"🔄 Usando fallback para '{self.name}' después de fallo")
                return fallback(*args, **kwargs)
            
            # Re-raise la excepción
            raise
    
    def __call__(self, func: Callable) -> Callable:
        """Decorador para funciones"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            return self.call(func, *args, **kwargs)
        return wrapper
    
    def get_stats(self) -> dict:
        """Retorna estadísticas del circuit breaker"""
        return {
            "name": self.name,
            "state": self.stats.state.value,
            "failure_count": self.stats.failure_count,
            "success_count": self.stats.success_count,
            "total_requests": self.stats.total_requests,
            "total_successes": self.stats.total_successes,
            "total_failures": self.stats.total_failures,
            "failure_rate": (
                self.stats.total_failures / self.stats.total_requests * 100
                if self.stats.total_requests > 0 else 0
            ),
        }


# === CIRCUIT BREAKERS GLOBALES ===

# Circuit Breaker para MercadoPago
mercadopago_circuit = CircuitBreaker(
    name="MercadoPago",
    config=CircuitBreakerConfig(
        failure_threshold=5,
        success_threshold=2,
        timeout=120,  # 2 minutos antes de reintentar
    )
)

# Circuit Breaker para AFIP
afip_circuit = CircuitBreaker(
    name="AFIP",
    config=CircuitBreakerConfig(
        failure_threshold=3,  # AFIP es más crítico, menos tolerancia
        success_threshold=2,
        timeout=300,  # 5 minutos antes de reintentar
    )
)

# Circuit Breaker genérico para otros servicios externos
generic_circuit = CircuitBreaker(
    name="ExternalService",
    config=CircuitBreakerConfig(
        failure_threshold=10,
        success_threshold=3,
        timeout=60,
    )
)
