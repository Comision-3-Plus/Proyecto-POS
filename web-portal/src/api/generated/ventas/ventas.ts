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
  HTTPValidationError,
  ListarVentasApiV1VentasGetParams,
  ProductoScanRead,
  VentaCreate,
  VentaListRead,
  VentaRead,
  VentaResumen,
} from ".././models";
import { customInstance } from "../../custom-instance";

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * ENDPOINT DE ESCANEO RÁPIDO
 * @summary Scan Producto
 */
export const scanProductoApiV1VentasScanCodigoGet = (
  codigo: string,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<ProductoScanRead>(
    { url: `/api/v1/ventas/scan/${codigo}`, method: "GET", signal },
    options,
  );
};

export const getScanProductoApiV1VentasScanCodigoGetQueryKey = (
  codigo: string,
) => {
  return [`/api/v1/ventas/scan/${codigo}`] as const;
};

export const getScanProductoApiV1VentasScanCodigoGetQueryOptions = <
  TData = Awaited<ReturnType<typeof scanProductoApiV1VentasScanCodigoGet>>,
  TError = HTTPValidationError,
>(
  codigo: string,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof scanProductoApiV1VentasScanCodigoGet>>,
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
    getScanProductoApiV1VentasScanCodigoGetQueryKey(codigo);

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof scanProductoApiV1VentasScanCodigoGet>>
  > = ({ signal }) =>
    scanProductoApiV1VentasScanCodigoGet(codigo, requestOptions, signal);

  return {
    queryKey,
    queryFn,
    enabled: !!codigo,
    ...queryOptions,
  } as UseQueryOptions<
    Awaited<ReturnType<typeof scanProductoApiV1VentasScanCodigoGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type ScanProductoApiV1VentasScanCodigoGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof scanProductoApiV1VentasScanCodigoGet>>
>;
export type ScanProductoApiV1VentasScanCodigoGetQueryError =
  HTTPValidationError;

/**
 * @summary Scan Producto
 */
export const useScanProductoApiV1VentasScanCodigoGet = <
  TData = Awaited<ReturnType<typeof scanProductoApiV1VentasScanCodigoGet>>,
  TError = HTTPValidationError,
>(
  codigo: string,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof scanProductoApiV1VentasScanCodigoGet>>,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getScanProductoApiV1VentasScanCodigoGetQueryOptions(
    codigo,
    options,
  );

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};

/**
 * ENDPOINT DE CHECKOUT - TRANSACCIÓN CRÍTICA
 * @summary Procesar Venta
 */
export const procesarVentaApiV1VentasCheckoutPost = (
  ventaCreate: VentaCreate,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<VentaResumen>(
    {
      url: `/api/v1/ventas/checkout`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: ventaCreate,
    },
    options,
  );
};

export const getProcesarVentaApiV1VentasCheckoutPostMutationOptions = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof procesarVentaApiV1VentasCheckoutPost>>,
    TError,
    { data: VentaCreate },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof procesarVentaApiV1VentasCheckoutPost>>,
  TError,
  { data: VentaCreate },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof procesarVentaApiV1VentasCheckoutPost>>,
    { data: VentaCreate }
  > = (props) => {
    const { data } = props ?? {};

    return procesarVentaApiV1VentasCheckoutPost(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type ProcesarVentaApiV1VentasCheckoutPostMutationResult = NonNullable<
  Awaited<ReturnType<typeof procesarVentaApiV1VentasCheckoutPost>>
>;
export type ProcesarVentaApiV1VentasCheckoutPostMutationBody = VentaCreate;
export type ProcesarVentaApiV1VentasCheckoutPostMutationError =
  HTTPValidationError;

/**
 * @summary Procesar Venta
 */
export const useProcesarVentaApiV1VentasCheckoutPost = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof procesarVentaApiV1VentasCheckoutPost>>,
    TError,
    { data: VentaCreate },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof procesarVentaApiV1VentasCheckoutPost>>,
  TError,
  { data: VentaCreate },
  TContext
> => {
  const mutationOptions =
    getProcesarVentaApiV1VentasCheckoutPostMutationOptions(options);

  return useMutation(mutationOptions);
};
/**
 * Lista ventas de la tienda actual con filtros opcionales
 * @summary Listar Ventas
 */
export const listarVentasApiV1VentasGet = (
  params?: ListarVentasApiV1VentasGetParams,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<VentaListRead[]>(
    { url: `/api/v1/ventas/`, method: "GET", params, signal },
    options,
  );
};

export const getListarVentasApiV1VentasGetQueryKey = (
  params?: ListarVentasApiV1VentasGetParams,
) => {
  return [`/api/v1/ventas/`, ...(params ? [params] : [])] as const;
};

export const getListarVentasApiV1VentasGetQueryOptions = <
  TData = Awaited<ReturnType<typeof listarVentasApiV1VentasGet>>,
  TError = HTTPValidationError,
>(
  params?: ListarVentasApiV1VentasGetParams,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof listarVentasApiV1VentasGet>>,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey =
    queryOptions?.queryKey ?? getListarVentasApiV1VentasGetQueryKey(params);

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof listarVentasApiV1VentasGet>>
  > = ({ signal }) =>
    listarVentasApiV1VentasGet(params, requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof listarVentasApiV1VentasGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type ListarVentasApiV1VentasGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof listarVentasApiV1VentasGet>>
>;
export type ListarVentasApiV1VentasGetQueryError = HTTPValidationError;

/**
 * @summary Listar Ventas
 */
export const useListarVentasApiV1VentasGet = <
  TData = Awaited<ReturnType<typeof listarVentasApiV1VentasGet>>,
  TError = HTTPValidationError,
>(
  params?: ListarVentasApiV1VentasGetParams,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof listarVentasApiV1VentasGet>>,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getListarVentasApiV1VentasGetQueryOptions(
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
 * Obtiene una venta específica con todos sus detalles
 * @summary Obtener Venta
 */
export const obtenerVentaApiV1VentasVentaIdGet = (
  ventaId: string,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<VentaRead>(
    { url: `/api/v1/ventas/${ventaId}`, method: "GET", signal },
    options,
  );
};

export const getObtenerVentaApiV1VentasVentaIdGetQueryKey = (
  ventaId: string,
) => {
  return [`/api/v1/ventas/${ventaId}`] as const;
};

export const getObtenerVentaApiV1VentasVentaIdGetQueryOptions = <
  TData = Awaited<ReturnType<typeof obtenerVentaApiV1VentasVentaIdGet>>,
  TError = HTTPValidationError,
>(
  ventaId: string,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof obtenerVentaApiV1VentasVentaIdGet>>,
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
    getObtenerVentaApiV1VentasVentaIdGetQueryKey(ventaId);

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof obtenerVentaApiV1VentasVentaIdGet>>
  > = ({ signal }) =>
    obtenerVentaApiV1VentasVentaIdGet(ventaId, requestOptions, signal);

  return {
    queryKey,
    queryFn,
    enabled: !!ventaId,
    ...queryOptions,
  } as UseQueryOptions<
    Awaited<ReturnType<typeof obtenerVentaApiV1VentasVentaIdGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type ObtenerVentaApiV1VentasVentaIdGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof obtenerVentaApiV1VentasVentaIdGet>>
>;
export type ObtenerVentaApiV1VentasVentaIdGetQueryError = HTTPValidationError;

/**
 * @summary Obtener Venta
 */
export const useObtenerVentaApiV1VentasVentaIdGet = <
  TData = Awaited<ReturnType<typeof obtenerVentaApiV1VentasVentaIdGet>>,
  TError = HTTPValidationError,
>(
  ventaId: string,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof obtenerVentaApiV1VentasVentaIdGet>>,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getObtenerVentaApiV1VentasVentaIdGetQueryOptions(
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
 * 🛡️ ENDPOINT PROTEGIDO: Anula una venta (requiere permiso VENTAS_DELETE)

Solo usuarios con rol 'owner' o 'super_admin' pueden anular ventas.
Los cajeros y admin NO tienen este permiso por defecto.

Acciones:
- Marca la venta como 'anulado'
- Devuelve el stock de los productos
- Registra auditoría de la operación
 * @summary Anular Venta
 */
export const anularVentaApiV1VentasVentaIdAnularPatch = (
  ventaId: string,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<VentaRead>(
    { url: `/api/v1/ventas/${ventaId}/anular`, method: "PATCH" },
    options,
  );
};

export const getAnularVentaApiV1VentasVentaIdAnularPatchMutationOptions = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof anularVentaApiV1VentasVentaIdAnularPatch>>,
    TError,
    { ventaId: string },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof anularVentaApiV1VentasVentaIdAnularPatch>>,
  TError,
  { ventaId: string },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof anularVentaApiV1VentasVentaIdAnularPatch>>,
    { ventaId: string }
  > = (props) => {
    const { ventaId } = props ?? {};

    return anularVentaApiV1VentasVentaIdAnularPatch(ventaId, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type AnularVentaApiV1VentasVentaIdAnularPatchMutationResult =
  NonNullable<
    Awaited<ReturnType<typeof anularVentaApiV1VentasVentaIdAnularPatch>>
  >;

export type AnularVentaApiV1VentasVentaIdAnularPatchMutationError =
  HTTPValidationError;

/**
 * @summary Anular Venta
 */
export const useAnularVentaApiV1VentasVentaIdAnularPatch = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof anularVentaApiV1VentasVentaIdAnularPatch>>,
    TError,
    { ventaId: string },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof anularVentaApiV1VentasVentaIdAnularPatch>>,
  TError,
  { ventaId: string },
  TContext
> => {
  const mutationOptions =
    getAnularVentaApiV1VentasVentaIdAnularPatchMutationOptions(options);

  return useMutation(mutationOptions);
};
