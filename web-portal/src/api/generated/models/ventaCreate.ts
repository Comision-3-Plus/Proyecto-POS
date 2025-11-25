/**
 * /**
 *  * 🤖 GENERADO AUTOMÁTICAMENTE POR ORVAL
 *  * ⚠️ NO EDITAR MANUALMENTE - Se sobrescribirá en la próxima generación
 *  *
 *  * Endpoint: undefined
 *  * Tag: undefined
 *  * Generado: 2025-11-24T21:12:17.605Z
 *  *\/
 */
import type { ItemVentaInput } from "./itemVentaInput";

/**
 * Schema para crear una venta completa
Incluye lista de items y método de pago
 */
export interface VentaCreate {
  /**
   * Lista de productos a vender
   * @minItems 1
   */
  items: ItemVentaInput[];
  /**
   * Método de pago utilizado
   * @pattern ^(EFECTIVO|MERCADOPAGO|TARJETA|efectivo|tarjeta_debito|tarjeta_credito|transferencia)$
   */
  metodo_pago: string;
}
