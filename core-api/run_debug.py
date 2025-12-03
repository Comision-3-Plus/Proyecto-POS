"""
Script para ejecutar el servidor con máximo debug
"""
import uvicorn
import logging
import sys

# Configurar logging máximo
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('debug_server.log')
    ]
)

logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("Iniciando servidor con debug completo...")
    
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            log_level="debug",
            reload=False,
            access_log=True
        )
    except Exception as e:
        logger.error(f"Error fatal: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        logger.info("Servidor finalizado")
