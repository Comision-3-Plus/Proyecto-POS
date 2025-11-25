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
import type { TokenUser } from "./tokenUser";

/**
 * Schema de respuesta de autenticación
 */
export interface Token {
  access_token: string;
  token_type?: string;
  user?: TokenUser;
}
