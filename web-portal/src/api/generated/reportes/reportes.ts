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
  AnalizarRentabilidadProductosApiV1ReportesProductosRentabilidadGetParams,
  HTTPValidationError,
  ObtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGetParams,
  ObtenerResumenVentasApiV1ReportesVentasResumenGetParams,
  ObtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGetParams,
  ProductoMasVendido,
  RentabilidadProducto,
  ResumenVentas,
  VentasPorPeriodo,
} from ".././models";
import { customInstance } from "../../custom-instance";

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Obtiene un resumen general de ventas para un período

Incluye:
- Total de ventas realizadas
- Monto total vendido
- Ticket promedio
- Método de pago más usado
- Producto más vendido
 * @summary Obtener Resumen Ventas
 */
export const obtenerResumenVentasApiV1ReportesVentasResumenGet = (
  params?: ObtenerResumenVentasApiV1ReportesVentasResumenGetParams,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<ResumenVentas>(
    { url: `/api/v1/reportes/ventas/resumen`, method: "GET", params, signal },
    options,
  );
};

export const getObtenerResumenVentasApiV1ReportesVentasResumenGetQueryKey = (
  params?: ObtenerResumenVentasApiV1ReportesVentasResumenGetParams,
) => {
  return [
    `/api/v1/reportes/ventas/resumen`,
    ...(params ? [params] : []),
  ] as const;
};

export const getObtenerResumenVentasApiV1ReportesVentasResumenGetQueryOptions =
  <
    TData = Awaited<
      ReturnType<typeof obtenerResumenVentasApiV1ReportesVentasResumenGet>
    >,
    TError = HTTPValidationError,
  >(
    params?: ObtenerResumenVentasApiV1ReportesVentasResumenGetParams,
    options?: {
      query?: Partial<
        UseQueryOptions<
          Awaited<
            ReturnType<typeof obtenerResumenVentasApiV1ReportesVentasResumenGet>
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
      getObtenerResumenVentasApiV1ReportesVentasResumenGetQueryKey(params);

    const queryFn: QueryFunction<
      Awaited<
        ReturnType<typeof obtenerResumenVentasApiV1ReportesVentasResumenGet>
      >
    > = ({ signal }) =>
      obtenerResumenVentasApiV1ReportesVentasResumenGet(
        params,
        requestOptions,
        signal,
      );

    return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
      Awaited<
        ReturnType<typeof obtenerResumenVentasApiV1ReportesVentasResumenGet>
      >,
      TError,
      TData
    > & { queryKey: QueryKey };
  };

export type ObtenerResumenVentasApiV1ReportesVentasResumenGetQueryResult =
  NonNullable<
    Awaited<
      ReturnType<typeof obtenerResumenVentasApiV1ReportesVentasResumenGet>
    >
  >;
export type ObtenerResumenVentasApiV1ReportesVentasResumenGetQueryError =
  HTTPValidationError;

/**
 * @summary Obtener Resumen Ventas
 */
export const useObtenerResumenVentasApiV1ReportesVentasResumenGet = <
  TData = Awaited<
    ReturnType<typeof obtenerResumenVentasApiV1ReportesVentasResumenGet>
  >,
  TError = HTTPValidationError,
>(
  params?: ObtenerResumenVentasApiV1ReportesVentasResumenGetParams,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<
          ReturnType<typeof obtenerResumenVentasApiV1ReportesVentasResumenGet>
        >,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions =
    getObtenerResumenVentasApiV1ReportesVentasResumenGetQueryOptions(
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
 * Retorna los productos más vendidos ordenados por cantidad

Útil para:
- Identificar productos estrella
- Optimizar inventario
- Planificar promociones
 * @summary Obtener Productos Mas Vendidos
 */
export const obtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGet = (
  params?: ObtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGetParams,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<ProductoMasVendido[]>(
    {
      url: `/api/v1/reportes/productos/mas-vendidos`,
      method: "GET",
      params,
      signal,
    },
    options,
  );
};

export const getObtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGetQueryKey =
  (
    params?: ObtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGetParams,
  ) => {
    return [
      `/api/v1/reportes/productos/mas-vendidos`,
      ...(params ? [params] : []),
    ] as const;
  };

export const getObtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGetQueryOptions =
  <
    TData = Awaited<
      ReturnType<
        typeof obtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGet
      >
    >,
    TError = HTTPValidationError,
  >(
    params?: ObtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGetParams,
    options?: {
      query?: Partial<
        UseQueryOptions<
          Awaited<
            ReturnType<
              typeof obtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGet
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
      getObtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGetQueryKey(
        params,
      );

    const queryFn: QueryFunction<
      Awaited<
        ReturnType<
          typeof obtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGet
        >
      >
    > = ({ signal }) =>
      obtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGet(
        params,
        requestOptions,
        signal,
      );

    return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
      Awaited<
        ReturnType<
          typeof obtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGet
        >
      >,
      TError,
      TData
    > & { queryKey: QueryKey };
  };

export type ObtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGetQueryResult =
  NonNullable<
    Awaited<
      ReturnType<
        typeof obtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGet
      >
    >
  >;
export type ObtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGetQueryError =
  HTTPValidationError;

/**
 * @summary Obtener Productos Mas Vendidos
 */
export const useObtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGet =
  <
    TData = Awaited<
      ReturnType<
        typeof obtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGet
      >
    >,
    TError = HTTPValidationError,
  >(
    params?: ObtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGetParams,
    options?: {
      query?: Partial<
        UseQueryOptions<
          Awaited<
            ReturnType<
              typeof obtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGet
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
      getObtenerProductosMasVendidosApiV1ReportesProductosMasVendidosGetQueryOptions(
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
 * Analiza la rentabilidad de productos vendidos

Calcula:
- Costo total (precio_costo × cantidad)
- Ingreso total (precio_venta × cantidad)
- Utilidad bruta (ingreso - costo)
- Margen de ganancia (%)

Permite ordenar por:
- utilidad: Mayor ganancia absoluta
- margen: Mayor porcentaje de ganancia
- cantidad: Más vendidos
 * @summary Analizar Rentabilidad Productos
 */
export const analizarRentabilidadProductosApiV1ReportesProductosRentabilidadGet =
  (
    params?: AnalizarRentabilidadProductosApiV1ReportesProductosRentabilidadGetParams,
    options?: SecondParameter<typeof customInstance>,
    signal?: AbortSignal,
  ) => {
    return customInstance<RentabilidadProducto[]>(
      {
        url: `/api/v1/reportes/productos/rentabilidad`,
        method: "GET",
        params,
        signal,
      },
      options,
    );
  };

export const getAnalizarRentabilidadProductosApiV1ReportesProductosRentabilidadGetQueryKey =
  (
    params?: AnalizarRentabilidadProductosApiV1ReportesProductosRentabilidadGetParams,
  ) => {
    return [
      `/api/v1/reportes/productos/rentabilidad`,
      ...(params ? [params] : []),
    ] as const;
  };

export const getAnalizarRentabilidadProductosApiV1ReportesProductosRentabilidadGetQueryOptions =
  <
    TData = Awaited<
      ReturnType<
        typeof analizarRentabilidadProductosApiV1ReportesProductosRentabilidadGet
      >
    >,
    TError = HTTPValidationError,
  >(
    params?: AnalizarRentabilidadProductosApiV1ReportesProductosRentabilidadGetParams,
    options?: {
      query?: Partial<
        UseQueryOptions<
          Awaited<
            ReturnType<
              typeof analizarRentabilidadProductosApiV1ReportesProductosRentabilidadGet
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
      getAnalizarRentabilidadProductosApiV1ReportesProductosRentabilidadGetQueryKey(
        params,
      );

    const queryFn: QueryFunction<
      Awaited<
        ReturnType<
          typeof analizarRentabilidadProductosApiV1ReportesProductosRentabilidadGet
        >
      >
    > = ({ signal }) =>
      analizarRentabilidadProductosApiV1ReportesProductosRentabilidadGet(
        params,
        requestOptions,
        signal,
      );

    return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
      Awaited<
        ReturnType<
          typeof analizarRentabilidadProductosApiV1ReportesProductosRentabilidadGet
        >
      >,
      TError,
      TData
    > & { queryKey: QueryKey };
  };

export type AnalizarRentabilidadProductosApiV1ReportesProductosRentabilidadGetQueryResult =
  NonNullable<
    Awaited<
      ReturnType<
        typeof analizarRentabilidadProductosApiV1ReportesProductosRentabilidadGet
      >
    >
  >;
export type AnalizarRentabilidadProductosApiV1ReportesProductosRentabilidadGetQueryError =
  HTTPValidationError;

/**
 * @summary Analizar Rentabilidad Productos
 */
export const useAnalizarRentabilidadProductosApiV1ReportesProductosRentabilidadGet =
  <
    TData = Awaited<
      ReturnType<
        typeof analizarRentabilidadProductosApiV1ReportesProductosRentabilidadGet
      >
    >,
    TError = HTTPValidationError,
  >(
    params?: AnalizarRentabilidadProductosApiV1ReportesProductosRentabilidadGetParams,
    options?: {
      query?: Partial<
        UseQueryOptions<
          Awaited<
            ReturnType<
              typeof analizarRentabilidadProductosApiV1ReportesProductosRentabilidadGet
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
      getAnalizarRentabilidadProductosApiV1ReportesProductosRentabilidadGetQueryOptions(
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
 * Retorna la tendencia de ventas día por día

Útil para:
- Gráficos de tendencia
- Identificar patrones de venta
- Proyecciones de demanda
 * @summary Obtener Tendencia Ventas Diaria
 */
export const obtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGet =
  (
    params?: ObtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGetParams,
    options?: SecondParameter<typeof customInstance>,
    signal?: AbortSignal,
  ) => {
    return customInstance<VentasPorPeriodo[]>(
      {
        url: `/api/v1/reportes/ventas/tendencia-diaria`,
        method: "GET",
        params,
        signal,
      },
      options,
    );
  };

export const getObtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGetQueryKey =
  (
    params?: ObtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGetParams,
  ) => {
    return [
      `/api/v1/reportes/ventas/tendencia-diaria`,
      ...(params ? [params] : []),
    ] as const;
  };

export const getObtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGetQueryOptions =
  <
    TData = Awaited<
      ReturnType<
        typeof obtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGet
      >
    >,
    TError = HTTPValidationError,
  >(
    params?: ObtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGetParams,
    options?: {
      query?: Partial<
        UseQueryOptions<
          Awaited<
            ReturnType<
              typeof obtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGet
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
      getObtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGetQueryKey(
        params,
      );

    const queryFn: QueryFunction<
      Awaited<
        ReturnType<
          typeof obtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGet
        >
      >
    > = ({ signal }) =>
      obtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGet(
        params,
        requestOptions,
        signal,
      );

    return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
      Awaited<
        ReturnType<
          typeof obtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGet
        >
      >,
      TError,
      TData
    > & { queryKey: QueryKey };
  };

export type ObtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGetQueryResult =
  NonNullable<
    Awaited<
      ReturnType<
        typeof obtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGet
      >
    >
  >;
export type ObtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGetQueryError =
  HTTPValidationError;

/**
 * @summary Obtener Tendencia Ventas Diaria
 */
export const useObtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGet =
  <
    TData = Awaited<
      ReturnType<
        typeof obtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGet
      >
    >,
    TError = HTTPValidationError,
  >(
    params?: ObtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGetParams,
    options?: {
      query?: Partial<
        UseQueryOptions<
          Awaited<
            ReturnType<
              typeof obtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGet
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
      getObtenerTendenciaVentasDiariaApiV1ReportesVentasTendenciaDiariaGetQueryOptions(
        params,
        options,
      );

    const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
      queryKey: QueryKey;
    };

    query.queryKey = queryOptions.queryKey;

    return query;
  };
