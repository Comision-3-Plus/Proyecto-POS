"""
Monitor de certificados digitales AFIP
Alerta sobre vencimientos próximos
"""
from datetime import datetime, timedelta
from typing import List, Optional
from pathlib import Path
from cryptography import x509
from cryptography.hazmat.backends import default_backend
import logging

logger = logging.getLogger(__name__)


class AFIPCertificateStatus:
    """Estado de un certificado AFIP"""
    
    def __init__(
        self,
        alias: str,
        filepath: Path,
        subject: str,
        issuer: str,
        valid_from: datetime,
        valid_to: datetime,
        days_until_expiry: int,
        is_expired: bool,
        is_near_expiry: bool
    ):
        self.alias = alias
        self.filepath = filepath
        self.subject = subject
        self.issuer = issuer
        self.valid_from = valid_from
        self.valid_to = valid_to
        self.days_until_expiry = days_until_expiry
        self.is_expired = is_expired
        self.is_near_expiry = is_near_expiry
    
    def to_dict(self):
        return {
            "alias": self.alias,
            "filepath": str(self.filepath),
            "subject": self.subject,
            "issuer": self.issuer,
            "valid_from": self.valid_from.isoformat(),
            "valid_to": self.valid_to.isoformat(),
            "days_until_expiry": self.days_until_expiry,
            "is_expired": self.is_expired,
            "is_near_expiry": self.is_near_expiry,
            "status": self.get_status_text(),
        }
    
    def get_status_text(self) -> str:
        if self.is_expired:
            return "VENCIDO"
        elif self.days_until_expiry <= 7:
            return "CRÍTICO - Vence en menos de 7 días"
        elif self.days_until_expiry <= 30:
            return "ADVERTENCIA - Vence en menos de 30 días"
        elif self.days_until_expiry <= 60:
            return "ATENCIÓN - Vence en menos de 60 días"
        else:
            return "OK"


class AFIPCertificateMonitor:
    """Monitor de certificados AFIP"""
    
    def __init__(self, cert_directory: str = "./certificates"):
        self.cert_directory = Path(cert_directory)
        self.warning_days = [60, 30, 15, 7, 3, 1]  # Días para alertas
    
    def load_certificate(self, cert_path: Path) -> Optional[x509.Certificate]:
        """Carga un certificado desde archivo"""
        try:
            with open(cert_path, 'rb') as f:
                cert_data = f.read()
                
                # Intentar cargar como PEM
                try:
                    cert = x509.load_pem_x509_certificate(
                        cert_data, default_backend()
                    )
                    return cert
                except:
                    # Intentar cargar como DER
                    cert = x509.load_der_x509_certificate(
                        cert_data, default_backend()
                    )
                    return cert
        except Exception as e:
            logger.error(f"Error al cargar certificado {cert_path}: {e}")
            return None
    
    def check_certificate(
        self,
        alias: str,
        cert_path: Path
    ) -> Optional[AFIPCertificateStatus]:
        """Verifica el estado de un certificado"""
        cert = self.load_certificate(cert_path)
        
        if not cert:
            return None
        
        now = datetime.utcnow()
        valid_from = cert.not_valid_before
        valid_to = cert.not_valid_after
        
        days_until_expiry = (valid_to - now).days
        is_expired = now > valid_to
        is_near_expiry = days_until_expiry <= 60
        
        # Extraer información del certificado
        subject = cert.subject.rfc4514_string()
        issuer = cert.issuer.rfc4514_string()
        
        return AFIPCertificateStatus(
            alias=alias,
            filepath=cert_path,
            subject=subject,
            issuer=issuer,
            valid_from=valid_from,
            valid_to=valid_to,
            days_until_expiry=days_until_expiry,
            is_expired=is_expired,
            is_near_expiry=is_near_expiry
        )
    
    def scan_certificates(self) -> List[AFIPCertificateStatus]:
        """Escanea todos los certificados en el directorio"""
        certificates = []
        
        if not self.cert_directory.exists():
            logger.warning(f"Directorio de certificados no existe: {self.cert_directory}")
            return certificates
        
        # Buscar archivos .crt, .pem, .cer
        for ext in ['*.crt', '*.pem', '*.cer']:
            for cert_file in self.cert_directory.glob(ext):
                alias = cert_file.stem
                status = self.check_certificate(alias, cert_file)
                
                if status:
                    certificates.append(status)
        
        return certificates
    
    def get_alerts(self) -> List[AFIPCertificateStatus]:
        """Obtiene certificados que requieren atención"""
        all_certs = self.scan_certificates()
        
        # Filtrar solo certificados vencidos o próximos a vencer
        alerts = [
            cert for cert in all_certs
            if cert.is_expired or cert.is_near_expiry
        ]
        
        # Ordenar por días hasta vencimiento (más urgentes primero)
        alerts.sort(key=lambda x: x.days_until_expiry)
        
        return alerts
    
    def get_summary(self) -> dict:
        """Obtiene resumen del estado de certificados"""
        all_certs = self.scan_certificates()
        
        total = len(all_certs)
        expired = sum(1 for c in all_certs if c.is_expired)
        critical = sum(1 for c in all_certs if not c.is_expired and c.days_until_expiry <= 7)
        warning = sum(1 for c in all_certs if not c.is_expired and 7 < c.days_until_expiry <= 30)
        ok = sum(1 for c in all_certs if not c.is_expired and c.days_until_expiry > 30)
        
        return {
            "total_certificates": total,
            "expired": expired,
            "critical": critical,  # < 7 días
            "warning": warning,    # 7-30 días
            "ok": ok,             # > 30 días
            "requires_attention": expired + critical + warning > 0,
            "certificates": [c.to_dict() for c in all_certs]
        }


# Ejemplo de uso
async def check_afip_certificates() -> dict:
    """
    Función helper para verificar certificados AFIP
    Puede ser llamada por un endpoint o tarea programada
    """
    monitor = AFIPCertificateMonitor()
    return monitor.get_summary()


async def get_certificate_alerts() -> List[dict]:
    """Obtiene solo alertas de certificados"""
    monitor = AFIPCertificateMonitor()
    alerts = monitor.get_alerts()
    return [alert.to_dict() for alert in alerts]
