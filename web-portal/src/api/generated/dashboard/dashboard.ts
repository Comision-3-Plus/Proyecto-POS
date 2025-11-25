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
import { useQuery } from "@tanstack/react-query";
import type {
  QueryFunction,
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import type {
  DashboardResumen,
  ObtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGet200,
} from ".././models";
import { customInstance } from "../../custom-instance";

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Endpoint principal del dashboard con todas las métricas consolidadas

Incluye:
- Ventas (hoy, ayer, semana, mes con % de cambio)
- Inventario (totales, bajo stock, valor)
- Productos destacados
- Alertas críticas

**Cacheado por 60 segundos para mejor performance**
 * @summary Obtener Dashboard Resumen
 */
export const obtenerDashboardResumenApiV1DashboardResumenGet = (
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<DashboardResumen>(
    { url: `/api/v1/dashboard/resumen`, method: "GET", signal },
    options,
  );
};

export const getObtenerDashboardResumenApiV1DashboardResumenGetQueryKey =
  () => {
    return [`/api/v1/dashboard/resumen`] as const;
  };

export const getObtenerDashboardResumenApiV1DashboardResumenGetQueryOptions = <
  TData = Awaited<
    ReturnType<typeof obtenerDashboardResumenApiV1DashboardResumenGet>
  >,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<
        ReturnType<typeof obtenerDashboardResumenApiV1DashboardResumenGet>
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
    getObtenerDashboardResumenApiV1DashboardResumenGetQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof obtenerDashboardResumenApiV1DashboardResumenGet>>
  > = ({ signal }) =>
    obtenerDashboardResumenApiV1DashboardResumenGet(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof obtenerDashboardResumenApiV1DashboardResumenGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type ObtenerDashboardResumenApiV1DashboardResumenGetQueryResult =
  NonNullable<
    Awaited<ReturnType<typeof obtenerDashboardResumenApiV1DashboardResumenGet>>
  >;
export type ObtenerDashboardResumenApiV1DashboardResumenGetQueryError = unknown;

/**
 * @summary Obtener Dashboard Resumen
 */
export const useObtenerDashboardResumenApiV1DashboardResumenGet = <
  TData = Awaited<
    ReturnType<typeof obtenerDashboardResumenApiV1DashboardResumenGet>
  >,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<
        ReturnType<typeof obtenerDashboardResumenApiV1DashboardResumenGet>
      >,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions =
    getObtenerDashboardResumenApiV1DashboardResumenGetQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};

/**
 * Ventas de las últimas 24 horas agrupadas por hora (para gráfico en tiempo real)

**Sin caché para datos en tiempo real**
 * @summary Obtener Ventas Tiempo Real
 */
export const obtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGet = (
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<ObtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGet200>(
    { url: `/api/v1/dashboard/ventas-tiempo-real`, method: "GET", signal },
    options,
  );
};

export const getObtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGetQueryKey =
  () => {
    return [`/api/v1/dashboard/ventas-tiempo-real`] as const;
  };

export const getObtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGetQueryOptions =
  <
    TData = Awaited<
      ReturnType<
        typeof obtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGet
      >
    >,
    TError = unknown,
  >(options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<
          ReturnType<
            typeof obtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGet
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
      getObtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGetQueryKey();

    const queryFn: QueryFunction<
      Awaited<
        ReturnType<
          typeof obtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGet
        >
      >
    > = ({ signal }) =>
      obtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGet(
        requestOptions,
        signal,
      );

    return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
      Awaited<
        ReturnType<
          typeof obtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGet
        >
      >,
      TError,
      TData
    > & { queryKey: QueryKey };
  };

export type ObtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGetQueryResult =
  NonNullable<
    Awaited<
      ReturnType<
        typeof obtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGet
      >
    >
  >;
export type ObtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGetQueryError =
  unknown;

/**
 * @summary Obtener Ventas Tiempo Real
 */
export const useObtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGet = <
  TData = Awaited<
    ReturnType<typeof obtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGet>
  >,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<
        ReturnType<
          typeof obtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGet
        >
      >,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions =
    getObtenerVentasTiempoRealApiV1DashboardVentasTiempoRealGetQueryOptions(
      options,
    );

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};
