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
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  MutationFunction,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import type {
  ConsultarEstadoPagoApiV1PaymentsStatusVentaIdGet200,
  EmitirFacturaManualApiV1PaymentsFacturarVentaIdPost200,
  EmitirFacturaManualApiV1PaymentsFacturarVentaIdPostParams,
  GenerarPagoApiV1PaymentsGenerateVentaIdPost200,
  HTTPValidationError,
  WebhookMercadopagoApiV1PaymentsWebhookPost200,
} from ".././models";
import { customInstance } from "../../custom-instance";

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Genera un link de pago o QR de Mercado Pago para una venta

Flujo:
1. Valida que la venta exista y pertenezca a la tienda
2. Obtiene los detalles de la venta
3. Crea una preferencia en Mercado Pago
4. Retorna el link de pago y QR para mostrar al cliente

Returns:
    preference_id: ID de la preferencia en MercadoPago
    init_point: URL para redirigir al cliente
    qr_code_url: URL del código QR (si está disponible)
 * @summary Generar Pago
 */
export const generarPagoApiV1PaymentsGenerateVentaIdPost = (
  ventaId: string,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<GenerarPagoApiV1PaymentsGenerateVentaIdPost200>(
    { url: `/api/v1/payments/generate/${ventaId}`, method: "POST" },
    options,
  );
};

export const getGenerarPagoApiV1PaymentsGenerateVentaIdPostMutationOptions = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof generarPagoApiV1PaymentsGenerateVentaIdPost>>,
    TError,
    { ventaId: string },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof generarPagoApiV1PaymentsGenerateVentaIdPost>>,
  TError,
  { ventaId: string },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof generarPagoApiV1PaymentsGenerateVentaIdPost>>,
    { ventaId: string }
  > = (props) => {
    const { ventaId } = props ?? {};

    return generarPagoApiV1PaymentsGenerateVentaIdPost(ventaId, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type GenerarPagoApiV1PaymentsGenerateVentaIdPostMutationResult =
  NonNullable<
    Awaited<ReturnType<typeof generarPagoApiV1PaymentsGenerateVentaIdPost>>
  >;

export type GenerarPagoApiV1PaymentsGenerateVentaIdPostMutationError =
  HTTPValidationError;

/**
 * @summary Generar Pago
 */
export const useGenerarPagoApiV1PaymentsGenerateVentaIdPost = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof generarPagoApiV1PaymentsGenerateVentaIdPost>>,
    TError,
    { ventaId: string },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof generarPagoApiV1PaymentsGenerateVentaIdPost>>,
  TError,
  { ventaId: string },
  TContext
> => {
  const mutationOptions =
    getGenerarPagoApiV1PaymentsGenerateVentaIdPostMutationOptions(options);

  return useMutation(mutationOptions);
};
/**
 * Webhook para recibir notificaciones de Mercado Pago

IMPORTANTE: Este endpoint debe responder 200 OK rápidamente
para evitar reintentos infinitos de MercadoPago

Tipos de notificación:
- payment: Pago procesado
- merchant_order: Orden actualizada

Flujo:
1. Recibe notificación de MercadoPago
2. Valida firma (opcional pero recomendado)
3. Consulta el estado del pago
4. Actualiza la venta en base de datos
5. Emite factura AFIP si corresponde
6. Responde 200 OK inmediatamente

Documentación:
https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 * @summary Webhook Mercadopago
 */
export const webhookMercadopagoApiV1PaymentsWebhookPost = (
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<WebhookMercadopagoApiV1PaymentsWebhookPost200>(
    { url: `/api/v1/payments/webhook`, method: "POST" },
    options,
  );
};

export const getWebhookMercadopagoApiV1PaymentsWebhookPostMutationOptions = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof webhookMercadopagoApiV1PaymentsWebhookPost>>,
    TError,
    void,
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof webhookMercadopagoApiV1PaymentsWebhookPost>>,
  TError,
  void,
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof webhookMercadopagoApiV1PaymentsWebhookPost>>,
    void
  > = () => {
    return webhookMercadopagoApiV1PaymentsWebhookPost(requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type WebhookMercadopagoApiV1PaymentsWebhookPostMutationResult =
  NonNullable<
    Awaited<ReturnType<typeof webhookMercadopagoApiV1PaymentsWebhookPost>>
  >;

export type WebhookMercadopagoApiV1PaymentsWebhookPostMutationError =
  HTTPValidationError;

/**
 * @summary Webhook Mercadopago
 */
export const useWebhookMercadopagoApiV1PaymentsWebhookPost = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof webhookMercadopagoApiV1PaymentsWebhookPost>>,
    TError,
    void,
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof webhookMercadopagoApiV1PaymentsWebhookPost>>,
  TError,
  void,
  TContext
> => {
  const mutationOptions =
    getWebhookMercadopagoApiV1PaymentsWebhookPostMutationOptions(options);

  return useMutation(mutationOptions);
};
/**
 * Consulta el estado de pago de una venta

Útil para polling desde el frontend mientras espera la confirmación
 * @summary Consultar Estado Pago
 */
export const consultarEstadoPagoApiV1PaymentsStatusVentaIdGet = (
  ventaId: string,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<ConsultarEstadoPagoApiV1PaymentsStatusVentaIdGet200>(
    { url: `/api/v1/payments/status/${ventaId}`, method: "GET", signal },
    options,
  );
};

export const getConsultarEstadoPagoApiV1PaymentsStatusVentaIdGetQueryKey = (
  ventaId: string,
) => {
  return [`/api/v1/payments/status/${ventaId}`] as const;
};

export const getConsultarEstadoPagoApiV1PaymentsStatusVentaIdGetQueryOptions = <
  TData = Awaited<
    ReturnType<typeof consultarEstadoPagoApiV1PaymentsStatusVentaIdGet>
  >,
  TError = HTTPValidationError,
>(
  ventaId: string,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<
          ReturnType<typeof consultarEstadoPagoApiV1PaymentsStatusVentaIdGet>
        >,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey =
    queryOptions?.queryKey ??
    getConsultarEstadoPagoApiV1PaymentsStatusVentaIdGetQueryKey(ventaId);

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof consultarEstadoPagoApiV1PaymentsStatusVentaIdGet>>
  > = ({ signal }) =>
    consultarEstadoPagoApiV1PaymentsStatusVentaIdGet(
      ventaId,
      requestOptions,
      signal,
    );

  return {
    queryKey,
    queryFn,
    enabled: !!ventaId,
    ...queryOptions,
  } as UseQueryOptions<
    Awaited<
      ReturnType<typeof consultarEstadoPagoApiV1PaymentsStatusVentaIdGet>
    >,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type ConsultarEstadoPagoApiV1PaymentsStatusVentaIdGetQueryResult =
  NonNullable<
    Awaited<ReturnType<typeof consultarEstadoPagoApiV1PaymentsStatusVentaIdGet>>
  >;
export type ConsultarEstadoPagoApiV1PaymentsStatusVentaIdGetQueryError =
  HTTPValidationError;

/**
 * @summary Consultar Estado Pago
 */
export const useConsultarEstadoPagoApiV1PaymentsStatusVentaIdGet = <
  TData = Awaited<
    ReturnType<typeof consultarEstadoPagoApiV1PaymentsStatusVentaIdGet>
  >,
  TError = HTTPValidationError,
>(
  ventaId: string,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<
          ReturnType<typeof consultarEstadoPagoApiV1PaymentsStatusVentaIdGet>
        >,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions =
    getConsultarEstadoPagoApiV1PaymentsStatusVentaIdGetQueryOptions(
      ventaId,
      options,
    );

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};

/**
 * Emite una factura AFIP manualmente para una venta

Útil cuando se necesita facturar después del pago
o para ventas en efectivo
 * @summary Emitir Factura Manual
 */
export const emitirFacturaManualApiV1PaymentsFacturarVentaIdPost = (
  ventaId: string,
  params?: EmitirFacturaManualApiV1PaymentsFacturarVentaIdPostParams,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<EmitirFacturaManualApiV1PaymentsFacturarVentaIdPost200>(
    { url: `/api/v1/payments/facturar/${ventaId}`, method: "POST", params },
    options,
  );
};

export const getEmitirFacturaManualApiV1PaymentsFacturarVentaIdPostMutationOptions =
  <TError = HTTPValidationError, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<
      Awaited<
        ReturnType<typeof emitirFacturaManualApiV1PaymentsFacturarVentaIdPost>
      >,
      TError,
      {
        ventaId: string;
        params?: EmitirFacturaManualApiV1PaymentsFacturarVentaIdPostParams;
      },
      TContext
    >;
    request?: SecondParameter<typeof customInstance>;
  }): UseMutationOptions<
    Awaited<
      ReturnType<typeof emitirFacturaManualApiV1PaymentsFacturarVentaIdPost>
    >,
    TError,
    {
      ventaId: string;
      params?: EmitirFacturaManualApiV1PaymentsFacturarVentaIdPostParams;
    },
    TContext
  > => {
    const { mutation: mutationOptions, request: requestOptions } =
      options ?? {};

    const mutationFn: MutationFunction<
      Awaited<
        ReturnType<typeof emitirFacturaManualApiV1PaymentsFacturarVentaIdPost>
      >,
      {
        ventaId: string;
        params?: EmitirFacturaManualApiV1PaymentsFacturarVentaIdPostParams;
      }
    > = (props) => {
      const { ventaId, params } = props ?? {};

      return emitirFacturaManualApiV1PaymentsFacturarVentaIdPost(
        ventaId,
        params,
        requestOptions,
      );
    };

    return { mutationFn, ...mutationOptions };
  };

export type EmitirFacturaManualApiV1PaymentsFacturarVentaIdPostMutationResult =
  NonNullable<
    Awaited<
      ReturnType<typeof emitirFacturaManualApiV1PaymentsFacturarVentaIdPost>
    >
  >;

export type EmitirFacturaManualApiV1PaymentsFacturarVentaIdPostMutationError =
  HTTPValidationError;

/**
 * @summary Emitir Factura Manual
 */
export const useEmitirFacturaManualApiV1PaymentsFacturarVentaIdPost = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<
      ReturnType<typeof emitirFacturaManualApiV1PaymentsFacturarVentaIdPost>
    >,
    TError,
    {
      ventaId: string;
      params?: EmitirFacturaManualApiV1PaymentsFacturarVentaIdPostParams;
    },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<
    ReturnType<typeof emitirFacturaManualApiV1PaymentsFacturarVentaIdPost>
  >,
  TError,
  {
    ventaId: string;
    params?: EmitirFacturaManualApiV1PaymentsFacturarVentaIdPostParams;
  },
  TContext
> => {
  const mutationOptions =
    getEmitirFacturaManualApiV1PaymentsFacturarVentaIdPostMutationOptions(
      options,
    );

  return useMutation(mutationOptions);
};
