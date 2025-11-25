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
import type { BodyLoginFormApiV1AuthLoginFormPostClientId } from "./bodyLoginFormApiV1AuthLoginFormPostClientId";
import type { BodyLoginFormApiV1AuthLoginFormPostClientSecret } from "./bodyLoginFormApiV1AuthLoginFormPostClientSecret";
import type { BodyLoginFormApiV1AuthLoginFormPostGrantType } from "./bodyLoginFormApiV1AuthLoginFormPostGrantType";

export interface BodyLoginFormApiV1AuthLoginFormPost {
  client_id?: BodyLoginFormApiV1AuthLoginFormPostClientId;
  client_secret?: BodyLoginFormApiV1AuthLoginFormPostClientSecret;
  grant_type?: BodyLoginFormApiV1AuthLoginFormPostGrantType;
  password: string;
  scope?: string;
  username: string;
}
