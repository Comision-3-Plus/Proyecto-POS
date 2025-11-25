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
import type { InsightReadExtraData } from "./insightReadExtraData";

/**
 * Schema de lectura para un Insight
 */
export interface InsightRead {
  created_at: string;
  extra_data: InsightReadExtraData;
  id: string;
  is_active: boolean;
  mensaje: string;
  nivel_urgencia: string;
  tipo: string;
}
