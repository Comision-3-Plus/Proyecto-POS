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
  AjusteStockRequest,
  HTTPValidationError,
  ObtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGetParams,
  ProductoBajoStock,
} from ".././models";
import { customInstance } from "../../custom-instance";

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Ajusta manualmente el stock de un producto

Casos de uso:
- Corrección de inventario
- Pérdida/robo de mercadería
- Producto dañado
- Inventario físico

IMPORTANTE: Genera registro de auditoría
 * @summary Ajustar Stock Manual
 */
export const ajustarStockManualApiV1InventarioAjustarStockPost = (
  ajusteStockRequest: AjusteStockRequest,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<unknown>(
    {
      url: `/api/v1/inventario/ajustar-stock`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: ajusteStockRequest,
    },
    options,
  );
};

export const getAjustarStockManualApiV1InventarioAjustarStockPostMutationOptions =
  <TError = HTTPValidationError, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<
      Awaited<
        ReturnType<typeof ajustarStockManualApiV1InventarioAjustarStockPost>
      >,
      TError,
      { data: AjusteStockRequest },
      TContext
    >;
    request?: SecondParameter<typeof customInstance>;
  }): UseMutationOptions<
    Awaited<
      ReturnType<typeof ajustarStockManualApiV1InventarioAjustarStockPost>
    >,
    TError,
    { data: AjusteStockRequest },
    TContext
  > => {
    const { mutation: mutationOptions, request: requestOptions } =
      options ?? {};

    const mutationFn: MutationFunction<
      Awaited<
        ReturnType<typeof ajustarStockManualApiV1InventarioAjustarStockPost>
      >,
      { data: AjusteStockRequest }
    > = (props) => {
      const { data } = props ?? {};

      return ajustarStockManualApiV1InventarioAjustarStockPost(
        data,
        requestOptions,
      );
    };

    return { mutationFn, ...mutationOptions };
  };

export type AjustarStockManualApiV1InventarioAjustarStockPostMutationResult =
  NonNullable<
    Awaited<
      ReturnType<typeof ajustarStockManualApiV1InventarioAjustarStockPost>
    >
  >;
export type AjustarStockManualApiV1InventarioAjustarStockPostMutationBody =
  AjusteStockRequest;
export type AjustarStockManualApiV1InventarioAjustarStockPostMutationError =
  HTTPValidationError;

/**
 * @summary Ajustar Stock Manual
 */
export const useAjustarStockManualApiV1InventarioAjustarStockPost = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<
      ReturnType<typeof ajustarStockManualApiV1InventarioAjustarStockPost>
    >,
    TError,
    { data: AjusteStockRequest },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof ajustarStockManualApiV1InventarioAjustarStockPost>>,
  TError,
  { data: AjusteStockRequest },
  TContext
> => {
  const mutationOptions =
    getAjustarStockManualApiV1InventarioAjustarStockPostMutationOptions(
      options,
    );

  return useMutation(mutationOptions);
};
/**
 * Obtiene lista de productos con stock bajo

Útil para:
- Dashboard de alertas
- Planificación de compras
- Prevenir quiebres de stock
 * @summary Obtener Alertas Stock Bajo
 */
export const obtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGet = (
  params?: ObtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGetParams,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<ProductoBajoStock[]>(
    {
      url: `/api/v1/inventario/alertas-stock-bajo`,
      method: "GET",
      params,
      signal,
    },
    options,
  );
};

export const getObtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGetQueryKey =
  (
    params?: ObtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGetParams,
  ) => {
    return [
      `/api/v1/inventario/alertas-stock-bajo`,
      ...(params ? [params] : []),
    ] as const;
  };

export const getObtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGetQueryOptions =
  <
    TData = Awaited<
      ReturnType<
        typeof obtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGet
      >
    >,
    TError = HTTPValidationError,
  >(
    params?: ObtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGetParams,
    options?: {
      query?: Partial<
        UseQueryOptions<
          Awaited<
            ReturnType<
              typeof obtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGet
            >
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
      getObtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGetQueryKey(
        params,
      );

    const queryFn: QueryFunction<
      Awaited<
        ReturnType<
          typeof obtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGet
        >
      >
    > = ({ signal }) =>
      obtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGet(
        params,
        requestOptions,
        signal,
      );

    return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
      Awaited<
        ReturnType<
          typeof obtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGet
        >
      >,
      TError,
      TData
    > & { queryKey: QueryKey };
  };

export type ObtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGetQueryResult =
  NonNullable<
    Awaited<
      ReturnType<
        typeof obtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGet
      >
    >
  >;
export type ObtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGetQueryError =
  HTTPValidationError;

/**
 * @summary Obtener Alertas Stock Bajo
 */
export const useObtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGet = <
  TData = Awaited<
    ReturnType<typeof obtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGet>
  >,
  TError = HTTPValidationError,
>(
  params?: ObtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGetParams,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<
          ReturnType<
            typeof obtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGet
          >
        >,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions =
    getObtenerAlertasStockBajoApiV1InventarioAlertasStockBajoGetQueryOptions(
      params,
      options,
    );

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};

/**
 * Retorna productos completamente sin stock

Urgente para reabastecimiento
 * @summary Obtener Productos Sin Stock
 */
export const obtenerProductosSinStockApiV1InventarioSinStockGet = (
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<unknown>(
    { url: `/api/v1/inventario/sin-stock`, method: "GET", signal },
    options,
  );
};

export const getObtenerProductosSinStockApiV1InventarioSinStockGetQueryKey =
  () => {
    return [`/api/v1/inventario/sin-stock`] as const;
  };

export const getObtenerProductosSinStockApiV1InventarioSinStockGetQueryOptions =
  <
    TData = Awaited<
      ReturnType<typeof obtenerProductosSinStockApiV1InventarioSinStockGet>
    >,
    TError = unknown,
  >(options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<
          ReturnType<typeof obtenerProductosSinStockApiV1InventarioSinStockGet>
        >,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  }) => {
    const { query: queryOptions, request: requestOptions } = options ?? {};

    const queryKey =
      queryOptions?.queryKey ??
      getObtenerProductosSinStockApiV1InventarioSinStockGetQueryKey();

    const queryFn: QueryFunction<
      Awaited<
        ReturnType<typeof obtenerProductosSinStockApiV1InventarioSinStockGet>
      >
    > = ({ signal }) =>
      obtenerProductosSinStockApiV1InventarioSinStockGet(
        requestOptions,
        signal,
      );

    return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
      Awaited<
        ReturnType<typeof obtenerProductosSinStockApiV1InventarioSinStockGet>
      >,
      TError,
      TData
    > & { queryKey: QueryKey };
  };

export type ObtenerProductosSinStockApiV1InventarioSinStockGetQueryResult =
  NonNullable<
    Awaited<
      ReturnType<typeof obtenerProductosSinStockApiV1InventarioSinStockGet>
    >
  >;
export type ObtenerProductosSinStockApiV1InventarioSinStockGetQueryError =
  unknown;

/**
 * @summary Obtener Productos Sin Stock
 */
export const useObtenerProductosSinStockApiV1InventarioSinStockGet = <
  TData = Awaited<
    ReturnType<typeof obtenerProductosSinStockApiV1InventarioSinStockGet>
  >,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<
        ReturnType<typeof obtenerProductosSinStockApiV1InventarioSinStockGet>
      >,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions =
    getObtenerProductosSinStockApiV1InventarioSinStockGetQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};

/**
 * Estadísticas generales del inventario

Incluye:
- Total de productos activos
- Valor total de inventario
- Productos sin stock
- Productos con stock bajo
 * @summary Obtener Estadisticas Inventario
 */
export const obtenerEstadisticasInventarioApiV1InventarioEstadisticasGet = (
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<unknown>(
    { url: `/api/v1/inventario/estadisticas`, method: "GET", signal },
    options,
  );
};

export const getObtenerEstadisticasInventarioApiV1InventarioEstadisticasGetQueryKey =
  () => {
    return [`/api/v1/inventario/estadisticas`] as const;
  };

export const getObtenerEstadisticasInventarioApiV1InventarioEstadisticasGetQueryOptions =
  <
    TData = Awaited<
      ReturnType<
        typeof obtenerEstadisticasInventarioApiV1InventarioEstadisticasGet
      >
    >,
    TError = unknown,
  >(options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<
          ReturnType<
            typeof obtenerEstadisticasInventarioApiV1InventarioEstadisticasGet
          >
        >,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  }) => {
    const { query: queryOptions, request: requestOptions } = options ?? {};

    const queryKey =
      queryOptions?.queryKey ??
      getObtenerEstadisticasInventarioApiV1InventarioEstadisticasGetQueryKey();

    const queryFn: QueryFunction<
      Awaited<
        ReturnType<
          typeof obtenerEstadisticasInventarioApiV1InventarioEstadisticasGet
        >
      >
    > = ({ signal }) =>
      obtenerEstadisticasInventarioApiV1InventarioEstadisticasGet(
        requestOptions,
        signal,
      );

    return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
      Awaited<
        ReturnType<
          typeof obtenerEstadisticasInventarioApiV1InventarioEstadisticasGet
        >
      >,
      TError,
      TData
    > & { queryKey: QueryKey };
  };

export type ObtenerEstadisticasInventarioApiV1InventarioEstadisticasGetQueryResult =
  NonNullable<
    Awaited<
      ReturnType<
        typeof obtenerEstadisticasInventarioApiV1InventarioEstadisticasGet
      >
    >
  >;
export type ObtenerEstadisticasInventarioApiV1InventarioEstadisticasGetQueryError =
  unknown;

/**
 * @summary Obtener Estadisticas Inventario
 */
export const useObtenerEstadisticasInventarioApiV1InventarioEstadisticasGet = <
  TData = Awaited<
    ReturnType<
      typeof obtenerEstadisticasInventarioApiV1InventarioEstadisticasGet
    >
  >,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<
        ReturnType<
          typeof obtenerEstadisticasInventarioApiV1InventarioEstadisticasGet
        >
      >,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions =
    getObtenerEstadisticasInventarioApiV1InventarioEstadisticasGetQueryOptions(
      options,
    );

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};
