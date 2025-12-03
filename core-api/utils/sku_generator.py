"""
SKU Generator - Generación automática de SKUs y códigos de barras
Sistema para retail de ropa con variantes
"""
import re
from typing import Optional
from uuid import UUID


class SKUGenerator:
    """
    Generador automático de SKUs para variantes de productos
    
    Formato: {BASE}-{COLOR}-{SIZE}
    Ejemplo: REM001-ROJO-M, PANT045-AZUL-42
    """
    
    @staticmethod
    def normalize_text(text: str, max_length: int = 4) -> str:
        """
        Normaliza texto para SKU: sin espacios, sin acentos, mayúsculas
        
        "Rojo Intenso" → "ROJO"
        "Azul Marino" → "AZUL"
        """
        if not text:
            return ""
        
        # Quitar acentos
        replacements = {
            'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
            'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
            'ñ': 'n', 'Ñ': 'N'
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        # Solo letras y números
        text = re.sub(r'[^A-Za-z0-9]', '', text)
        
        # Mayúsculas
        text = text.upper()
        
        # Tomar solo primeras palabras
        return text[:max_length]
    
    @staticmethod
    def generate_variant_sku(
        base_sku: str,
        color_name: Optional[str] = None,
        size_name: Optional[str] = None
    ) -> str:
        """
        Genera SKU de variante
        
        Args:
            base_sku: SKU base del producto (ej: "REM-001")
            color_name: Nombre del color (ej: "Rojo Intenso")
            size_name: Nombre del talle (ej: "M", "42")
        
        Returns:
            SKU completo: "REM-001-ROJO-M"
        
        Examples:
            >>> generate_variant_sku("REM-001", "Rojo", "M")
            "REM-001-ROJO-M"
            
            >>> generate_variant_sku("PANT-045", "Azul Marino", "42")
            "PANT-045-AZUL-42"
            
            >>> generate_variant_sku("ACC-010", None, "UNICO")
            "ACC-010-UNICO"
        """
        parts = [base_sku.upper()]
        
        if color_name:
            color_code = SKUGenerator.normalize_text(color_name, max_length=6)
            if color_code:
                parts.append(color_code)
        
        if size_name:
            size_code = SKUGenerator.normalize_text(size_name, max_length=4)
            if size_code:
                parts.append(size_code)
        
        return "-".join(parts)
    
    @staticmethod
    def generate_base_sku(
        category: str,
        sequence: int,
        prefix_length: int = 4
    ) -> str:
        """
        Genera SKU base para producto
        
        Args:
            category: Categoría del producto ("Remeras", "Pantalones")
            sequence: Número secuencial (1, 2, 3...)
            prefix_length: Longitud del prefijo de categoría
        
        Returns:
            SKU base: "REMER-001", "PANT-045"
        
        Examples:
            >>> generate_base_sku("Remeras", 1)
            "REMER-001"
            
            >>> generate_base_sku("Pantalones", 45)
            "PANT-045"
        """
        prefix = SKUGenerator.normalize_text(category, max_length=prefix_length)
        padded_sequence = str(sequence).zfill(3)  # 001, 002, 045
        
        return f"{prefix}-{padded_sequence}"


class BarcodeGenerator:
    """
    Generador de códigos de barras EAN-13
    
    EAN-13: 13 dígitos
    - 3 primeros: Código de país (779 = Argentina)
    - 4-9: Código de empresa
    - 10-12: Código de producto
    - 13: Dígito verificador (checksum)
    """
    
    COUNTRY_CODE = "779"  # Argentina
    
    @staticmethod
    def calculate_ean13_checksum(partial_code: str) -> str:
        """
        Calcula dígito verificador EAN-13
        
        Algoritmo:
        1. Multiplicar posiciones impares por 1, pares por 3
        2. Sumar todos
        3. Restar del próximo múltiplo de 10
        
        Args:
            partial_code: 12 dígitos
        
        Returns:
            Dígito verificador (0-9)
        """
        if len(partial_code) != 12:
            raise ValueError("Código parcial debe tener 12 dígitos")
        
        total = 0
        for i, digit in enumerate(partial_code):
            # Posiciones impares (0-indexed) × 1, pares × 3
            multiplier = 3 if i % 2 == 1 else 1
            total += int(digit) * multiplier
        
        # Próximo múltiplo de 10
        next_ten = ((total // 10) + 1) * 10
        checksum = next_ten - total
        
        # Si es 10, el checksum es 0
        return str(checksum % 10)
    
    @staticmethod
    def generate_ean13_from_uuid(
        variant_id: UUID,
        store_code: str = "0001"
    ) -> str:
        """
        Genera EAN-13 único a partir de variant_id
        
        Formato: 779 + store_code(4) + variant_hash(5) + checksum(1)
        
        Args:
            variant_id: UUID de la variante
            store_code: Código de la tienda (4 dígitos)
        
        Returns:
            Código EAN-13 válido
        
        Examples:
            >>> generate_ean13_from_uuid(UUID("..."), "0001")
            "7790001234567"  # 13 dígitos
        """
        # Asegurar que store_code sea 4 dígitos
        store_code = str(store_code).zfill(4)[:4]
        
        # Obtener hash de UUID (últimos 8 dígitos hex → 5 dígitos dec)
        uuid_hex = str(variant_id).replace("-", "")
        uuid_int = int(uuid_hex[-8:], 16)  # Últimos 8 caracteres hex
        variant_hash = str(uuid_int)[-5:].zfill(5)  # 5 dígitos
        
        # Construir código parcial (12 dígitos)
        partial = BarcodeGenerator.COUNTRY_CODE + store_code + variant_hash
        
        # Calcular checksum
        checksum = BarcodeGenerator.calculate_ean13_checksum(partial)
        
        return partial + checksum
    
    @staticmethod
    def generate_ean13_sequential(
        store_code: str,
        product_sequence: int
    ) -> str:
        """
        Genera EAN-13 secuencial (alternativa más simple)
        
        Formato: 779 + store_code(4) + sequence(5) + checksum(1)
        
        Args:
            store_code: Código de tienda (4 dígitos)
            product_sequence: Número secuencial de producto
        
        Returns:
            Código EAN-13 válido
        
        Examples:
            >>> generate_ean13_sequential("0001", 12345)
            "7790001123458"
        """
        store_code = str(store_code).zfill(4)[:4]
        sequence = str(product_sequence).zfill(5)[:5]
        
        partial = BarcodeGenerator.COUNTRY_CODE + store_code + sequence
        checksum = BarcodeGenerator.calculate_ean13_checksum(partial)
        
        return partial + checksum
    
    @staticmethod
    def validate_ean13(barcode: str) -> bool:
        """
        Valida que un código EAN-13 sea correcto
        
        Args:
            barcode: Código de 13 dígitos
        
        Returns:
            True si es válido
        """
        if not barcode or len(barcode) != 13:
            return False
        
        if not barcode.isdigit():
            return False
        
        # Validar checksum
        partial = barcode[:12]
        expected_checksum = BarcodeGenerator.calculate_ean13_checksum(partial)
        
        return barcode[12] == expected_checksum


# Funciones de utilidad
def auto_generate_sku_for_variant(
    product_base_sku: str,
    color_name: Optional[str],
    size_name: Optional[str]
) -> str:
    """
    Genera SKU automáticamente para una variante
    Usar en creación de ProductVariant
    """
    return SKUGenerator.generate_variant_sku(
        base_sku=product_base_sku,
        color_name=color_name,
        size_name=size_name
    )


def auto_generate_barcode_for_variant(
    variant_id: UUID,
    tienda_id: UUID
) -> str:
    """
    Genera barcode EAN-13 automáticamente
    Usar en creación de ProductVariant
    
    TODO: Extraer store_code de tienda_id (hash o secuencial)
    """
    # Por ahora usar hash del tienda_id como store_code
    store_hash = str(tienda_id).replace("-", "")[:4]
    store_code = str(int(store_hash, 16))[:4].zfill(4)
    
    return BarcodeGenerator.generate_ean13_from_uuid(
        variant_id=variant_id,
        store_code=store_code
    )


if __name__ == "__main__":
    # Tests
    print("=== SKU GENERATOR ===")
    print(SKUGenerator.generate_variant_sku("REM-001", "Rojo Intenso", "M"))
    print(SKUGenerator.generate_variant_sku("PANT-045", "Azul Marino", "42"))
    print(SKUGenerator.generate_base_sku("Remeras", 1))
    print(SKUGenerator.generate_base_sku("Pantalones", 45))
    
    print("\n=== BARCODE GENERATOR ===")
    test_uuid = UUID("550e8400-e29b-41d4-a716-446655440000")
    barcode = BarcodeGenerator.generate_ean13_from_uuid(test_uuid, "0001")
    print(f"EAN-13: {barcode}")
    print(f"Valid: {BarcodeGenerator.validate_ean13(barcode)}")
    
    barcode_seq = BarcodeGenerator.generate_ean13_sequential("0001", 12345)
    print(f"EAN-13 Sequential: {barcode_seq}")
    print(f"Valid: {BarcodeGenerator.validate_ean13(barcode_seq)}")
