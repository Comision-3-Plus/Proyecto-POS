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
  ExportarProductosCsvApiV1ExportarProductosCsvGetParams,
  ExportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGetParams,
  ExportarVentasCsvApiV1ExportarVentasCsvGetParams,
  HTTPValidationError,
} from ".././models";
import { customInstance } from "../../custom-instance";

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Exporta listado de productos a formato CSV

Columnas: SKU, Nombre, Tipo, Precio Venta, Precio Costo, Stock, Estado
 * @summary Exportar Productos Csv
 */
export const exportarProductosCsvApiV1ExportarProductosCsvGet = (
  params?: ExportarProductosCsvApiV1ExportarProductosCsvGetParams,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<unknown>(
    { url: `/api/v1/exportar/productos/csv`, method: "GET", params, signal },
    options,
  );
};

export const getExportarProductosCsvApiV1ExportarProductosCsvGetQueryKey = (
  params?: ExportarProductosCsvApiV1ExportarProductosCsvGetParams,
) => {
  return [
    `/api/v1/exportar/productos/csv`,
    ...(params ? [params] : []),
  ] as const;
};

export const getExportarProductosCsvApiV1ExportarProductosCsvGetQueryOptions = <
  TData = Awaited<
    ReturnType<typeof exportarProductosCsvApiV1ExportarProductosCsvGet>
  >,
  TError = HTTPValidationError,
>(
  params?: ExportarProductosCsvApiV1ExportarProductosCsvGetParams,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<
          ReturnType<typeof exportarProductosCsvApiV1ExportarProductosCsvGet>
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
    getExportarProductosCsvApiV1ExportarProductosCsvGetQueryKey(params);

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof exportarProductosCsvApiV1ExportarProductosCsvGet>>
  > = ({ signal }) =>
    exportarProductosCsvApiV1ExportarProductosCsvGet(
      params,
      requestOptions,
      signal,
    );

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<
      ReturnType<typeof exportarProductosCsvApiV1ExportarProductosCsvGet>
    >,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type ExportarProductosCsvApiV1ExportarProductosCsvGetQueryResult =
  NonNullable<
    Awaited<ReturnType<typeof exportarProductosCsvApiV1ExportarProductosCsvGet>>
  >;
export type ExportarProductosCsvApiV1ExportarProductosCsvGetQueryError =
  HTTPValidationError;

/**
 * @summary Exportar Productos Csv
 */
export const useExportarProductosCsvApiV1ExportarProductosCsvGet = <
  TData = Awaited<
    ReturnType<typeof exportarProductosCsvApiV1ExportarProductosCsvGet>
  >,
  TError = HTTPValidationError,
>(
  params?: ExportarProductosCsvApiV1ExportarProductosCsvGetParams,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<
          ReturnType<typeof exportarProductosCsvApiV1ExportarProductosCsvGet>
        >,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions =
    getExportarProductosCsvApiV1ExportarProductosCsvGetQueryOptions(
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
 * Exporta ventas a formato CSV con filtros de fecha

Columnas: Fecha, ID Venta, Total, Método Pago, Status, Cantidad Items
 * @summary Exportar Ventas Csv
 */
export const exportarVentasCsvApiV1ExportarVentasCsvGet = (
  params?: ExportarVentasCsvApiV1ExportarVentasCsvGetParams,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<unknown>(
    { url: `/api/v1/exportar/ventas/csv`, method: "GET", params, signal },
    options,
  );
};

export const getExportarVentasCsvApiV1ExportarVentasCsvGetQueryKey = (
  params?: ExportarVentasCsvApiV1ExportarVentasCsvGetParams,
) => {
  return [`/api/v1/exportar/ventas/csv`, ...(params ? [params] : [])] as const;
};

export const getExportarVentasCsvApiV1ExportarVentasCsvGetQueryOptions = <
  TData = Awaited<
    ReturnType<typeof exportarVentasCsvApiV1ExportarVentasCsvGet>
  >,
  TError = HTTPValidationError,
>(
  params?: ExportarVentasCsvApiV1ExportarVentasCsvGetParams,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof exportarVentasCsvApiV1ExportarVentasCsvGet>>,
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
    getExportarVentasCsvApiV1ExportarVentasCsvGetQueryKey(params);

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof exportarVentasCsvApiV1ExportarVentasCsvGet>>
  > = ({ signal }) =>
    exportarVentasCsvApiV1ExportarVentasCsvGet(params, requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof exportarVentasCsvApiV1ExportarVentasCsvGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type ExportarVentasCsvApiV1ExportarVentasCsvGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof exportarVentasCsvApiV1ExportarVentasCsvGet>>
>;
export type ExportarVentasCsvApiV1ExportarVentasCsvGetQueryError =
  HTTPValidationError;

/**
 * @summary Exportar Ventas Csv
 */
export const useExportarVentasCsvApiV1ExportarVentasCsvGet = <
  TData = Awaited<
    ReturnType<typeof exportarVentasCsvApiV1ExportarVentasCsvGet>
  >,
  TError = HTTPValidationError,
>(
  params?: ExportarVentasCsvApiV1ExportarVentasCsvGetParams,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof exportarVentasCsvApiV1ExportarVentasCsvGet>>,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions =
    getExportarVentasCsvApiV1ExportarVentasCsvGetQueryOptions(params, options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};

/**
 * Exporta análisis de rentabilidad de productos a CSV

Columnas: Producto, SKU, Cantidad Vendida, Costo Total, Ingreso Total, Utilidad, Margen %
 * @summary Exportar Rentabilidad Csv
 */
export const exportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGet = (
  params?: ExportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGetParams,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<unknown>(
    {
      url: `/api/v1/exportar/reportes/rentabilidad/csv`,
      method: "GET",
      params,
      signal,
    },
    options,
  );
};

export const getExportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGetQueryKey =
  (
    params?: ExportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGetParams,
  ) => {
    return [
      `/api/v1/exportar/reportes/rentabilidad/csv`,
      ...(params ? [params] : []),
    ] as const;
  };

export const getExportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGetQueryOptions =
  <
    TData = Awaited<
      ReturnType<
        typeof exportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGet
      >
    >,
    TError = HTTPValidationError,
  >(
    params?: ExportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGetParams,
    options?: {
      query?: Partial<
        UseQueryOptions<
          Awaited<
            ReturnType<
              typeof exportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGet
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
      getExportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGetQueryKey(
        params,
      );

    const queryFn: QueryFunction<
      Awaited<
        ReturnType<
          typeof exportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGet
        >
      >
    > = ({ signal }) =>
      exportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGet(
        params,
        requestOptions,
        signal,
      );

    return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
      Awaited<
        ReturnType<
          typeof exportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGet
        >
      >,
      TError,
      TData
    > & { queryKey: QueryKey };
  };

export type ExportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGetQueryResult =
  NonNullable<
    Awaited<
      ReturnType<
        typeof exportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGet
      >
    >
  >;
export type ExportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGetQueryError =
  HTTPValidationError;

/**
 * @summary Exportar Rentabilidad Csv
 */
export const useExportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGet =
  <
    TData = Awaited<
      ReturnType<
        typeof exportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGet
      >
    >,
    TError = HTTPValidationError,
  >(
    params?: ExportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGetParams,
    options?: {
      query?: Partial<
        UseQueryOptions<
          Awaited<
            ReturnType<
              typeof exportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGet
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
      getExportarRentabilidadCsvApiV1ExportarReportesRentabilidadCsvGetQueryOptions(
        params,
        options,
      );

    const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
      queryKey: QueryKey;
    };

    query.queryKey = queryOptions.queryKey;

    return query;
  };
