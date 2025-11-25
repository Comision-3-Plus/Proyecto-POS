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
  BuscarProductosAvanzadoApiV1ProductosBuscarGet200,
  BuscarProductosAvanzadoApiV1ProductosBuscarGetParams,
  HTTPValidationError,
  ListarProductosApiV1ProductosGetParams,
  ProductoCreate,
  ProductoRead,
  ProductoReadWithCalculatedStock,
  ProductoUpdate,
} from ".././models";
import { customInstance } from "../../custom-instance";

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Crea un nuevo producto para la tienda actual

- Asigna automáticamente el tienda_id de la tienda actual
- Para productos tipo 'ropa', calcula el stock_actual desde las variantes
- Valida que el SKU no esté duplicado en la tienda
- **NUEVO**: Validación polimórfica de atributos según tipo
 * @summary Crear Producto
 */
export const crearProductoApiV1ProductosPost = (
  productoCreate: ProductoCreate,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<ProductoRead>(
    {
      url: `/api/v1/productos/`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: productoCreate,
    },
    options,
  );
};

export const getCrearProductoApiV1ProductosPostMutationOptions = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof crearProductoApiV1ProductosPost>>,
    TError,
    { data: ProductoCreate },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof crearProductoApiV1ProductosPost>>,
  TError,
  { data: ProductoCreate },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof crearProductoApiV1ProductosPost>>,
    { data: ProductoCreate }
  > = (props) => {
    const { data } = props ?? {};

    return crearProductoApiV1ProductosPost(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type CrearProductoApiV1ProductosPostMutationResult = NonNullable<
  Awaited<ReturnType<typeof crearProductoApiV1ProductosPost>>
>;
export type CrearProductoApiV1ProductosPostMutationBody = ProductoCreate;
export type CrearProductoApiV1ProductosPostMutationError = HTTPValidationError;

/**
 * @summary Crear Producto
 */
export const useCrearProductoApiV1ProductosPost = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof crearProductoApiV1ProductosPost>>,
    TError,
    { data: ProductoCreate },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof crearProductoApiV1ProductosPost>>,
  TError,
  { data: ProductoCreate },
  TContext
> => {
  const mutationOptions =
    getCrearProductoApiV1ProductosPostMutationOptions(options);

  return useMutation(mutationOptions);
};
/**
 * Lista productos de la tienda actual con filtros opcionales

Filtros:
- search: Busca por SKU o nombre (case-insensitive)
- tipo: Filtra por tipo de producto
- is_active: Filtra por productos activos/inactivos

⚡ OPTIMIZADO: Índices en sku, nombre, is_active, tienda_id
 * @summary Listar Productos
 */
export const listarProductosApiV1ProductosGet = (
  params?: ListarProductosApiV1ProductosGetParams,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<ProductoReadWithCalculatedStock[]>(
    { url: `/api/v1/productos/`, method: "GET", params, signal },
    options,
  );
};

export const getListarProductosApiV1ProductosGetQueryKey = (
  params?: ListarProductosApiV1ProductosGetParams,
) => {
  return [`/api/v1/productos/`, ...(params ? [params] : [])] as const;
};

export const getListarProductosApiV1ProductosGetQueryOptions = <
  TData = Awaited<ReturnType<typeof listarProductosApiV1ProductosGet>>,
  TError = HTTPValidationError,
>(
  params?: ListarProductosApiV1ProductosGetParams,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof listarProductosApiV1ProductosGet>>,
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
    getListarProductosApiV1ProductosGetQueryKey(params);

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof listarProductosApiV1ProductosGet>>
  > = ({ signal }) =>
    listarProductosApiV1ProductosGet(params, requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof listarProductosApiV1ProductosGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type ListarProductosApiV1ProductosGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof listarProductosApiV1ProductosGet>>
>;
export type ListarProductosApiV1ProductosGetQueryError = HTTPValidationError;

/**
 * @summary Listar Productos
 */
export const useListarProductosApiV1ProductosGet = <
  TData = Awaited<ReturnType<typeof listarProductosApiV1ProductosGet>>,
  TError = HTTPValidationError,
>(
  params?: ListarProductosApiV1ProductosGetParams,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof listarProductosApiV1ProductosGet>>,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getListarProductosApiV1ProductosGetQueryOptions(
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
 * Búsqueda avanzada de productos con múltiples filtros

Filtros disponibles:
- q: Búsqueda por nombre o SKU (case-insensitive)
- tipo: Filtrar por tipo de producto
- precio_min/max: Rango de precios
- stock_min: Stock mínimo
- solo_activos: Solo productos activos

Retorna: items, total, paginación
 * @summary Buscar Productos Avanzado
 */
export const buscarProductosAvanzadoApiV1ProductosBuscarGet = (
  params?: BuscarProductosAvanzadoApiV1ProductosBuscarGetParams,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<BuscarProductosAvanzadoApiV1ProductosBuscarGet200>(
    { url: `/api/v1/productos/buscar`, method: "GET", params, signal },
    options,
  );
};

export const getBuscarProductosAvanzadoApiV1ProductosBuscarGetQueryKey = (
  params?: BuscarProductosAvanzadoApiV1ProductosBuscarGetParams,
) => {
  return [`/api/v1/productos/buscar`, ...(params ? [params] : [])] as const;
};

export const getBuscarProductosAvanzadoApiV1ProductosBuscarGetQueryOptions = <
  TData = Awaited<
    ReturnType<typeof buscarProductosAvanzadoApiV1ProductosBuscarGet>
  >,
  TError = HTTPValidationError,
>(
  params?: BuscarProductosAvanzadoApiV1ProductosBuscarGetParams,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<
          ReturnType<typeof buscarProductosAvanzadoApiV1ProductosBuscarGet>
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
    getBuscarProductosAvanzadoApiV1ProductosBuscarGetQueryKey(params);

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof buscarProductosAvanzadoApiV1ProductosBuscarGet>>
  > = ({ signal }) =>
    buscarProductosAvanzadoApiV1ProductosBuscarGet(
      params,
      requestOptions,
      signal,
    );

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof buscarProductosAvanzadoApiV1ProductosBuscarGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type BuscarProductosAvanzadoApiV1ProductosBuscarGetQueryResult =
  NonNullable<
    Awaited<ReturnType<typeof buscarProductosAvanzadoApiV1ProductosBuscarGet>>
  >;
export type BuscarProductosAvanzadoApiV1ProductosBuscarGetQueryError =
  HTTPValidationError;

/**
 * @summary Buscar Productos Avanzado
 */
export const useBuscarProductosAvanzadoApiV1ProductosBuscarGet = <
  TData = Awaited<
    ReturnType<typeof buscarProductosAvanzadoApiV1ProductosBuscarGet>
  >,
  TError = HTTPValidationError,
>(
  params?: BuscarProductosAvanzadoApiV1ProductosBuscarGetParams,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<
          ReturnType<typeof buscarProductosAvanzadoApiV1ProductosBuscarGet>
        >,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions =
    getBuscarProductosAvanzadoApiV1ProductosBuscarGetQueryOptions(
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
 * Obtiene un producto específico por ID
Valida que pertenezca a la tienda actual (Multi-Tenant)
 * @summary Obtener Producto
 */
export const obtenerProductoApiV1ProductosProductoIdGet = (
  productoId: string,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<ProductoReadWithCalculatedStock>(
    { url: `/api/v1/productos/${productoId}`, method: "GET", signal },
    options,
  );
};

export const getObtenerProductoApiV1ProductosProductoIdGetQueryKey = (
  productoId: string,
) => {
  return [`/api/v1/productos/${productoId}`] as const;
};

export const getObtenerProductoApiV1ProductosProductoIdGetQueryOptions = <
  TData = Awaited<
    ReturnType<typeof obtenerProductoApiV1ProductosProductoIdGet>
  >,
  TError = HTTPValidationError,
>(
  productoId: string,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof obtenerProductoApiV1ProductosProductoIdGet>>,
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
    getObtenerProductoApiV1ProductosProductoIdGetQueryKey(productoId);

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof obtenerProductoApiV1ProductosProductoIdGet>>
  > = ({ signal }) =>
    obtenerProductoApiV1ProductosProductoIdGet(
      productoId,
      requestOptions,
      signal,
    );

  return {
    queryKey,
    queryFn,
    enabled: !!productoId,
    ...queryOptions,
  } as UseQueryOptions<
    Awaited<ReturnType<typeof obtenerProductoApiV1ProductosProductoIdGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type ObtenerProductoApiV1ProductosProductoIdGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof obtenerProductoApiV1ProductosProductoIdGet>>
>;
export type ObtenerProductoApiV1ProductosProductoIdGetQueryError =
  HTTPValidationError;

/**
 * @summary Obtener Producto
 */
export const useObtenerProductoApiV1ProductosProductoIdGet = <
  TData = Awaited<
    ReturnType<typeof obtenerProductoApiV1ProductosProductoIdGet>
  >,
  TError = HTTPValidationError,
>(
  productoId: string,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof obtenerProductoApiV1ProductosProductoIdGet>>,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions =
    getObtenerProductoApiV1ProductosProductoIdGetQueryOptions(
      productoId,
      options,
    );

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};

/**
 * Actualiza un producto existente

- Solo actualiza los campos enviados (PATCH parcial)
- Para productos tipo ropa, recalcula el stock si se actualizan las variantes
- Valida pertenencia a la tienda actual
 * @summary Actualizar Producto
 */
export const actualizarProductoApiV1ProductosProductoIdPatch = (
  productoId: string,
  productoUpdate: ProductoUpdate,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<ProductoRead>(
    {
      url: `/api/v1/productos/${productoId}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: productoUpdate,
    },
    options,
  );
};

export const getActualizarProductoApiV1ProductosProductoIdPatchMutationOptions =
  <TError = HTTPValidationError, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<
      Awaited<
        ReturnType<typeof actualizarProductoApiV1ProductosProductoIdPatch>
      >,
      TError,
      { productoId: string; data: ProductoUpdate },
      TContext
    >;
    request?: SecondParameter<typeof customInstance>;
  }): UseMutationOptions<
    Awaited<ReturnType<typeof actualizarProductoApiV1ProductosProductoIdPatch>>,
    TError,
    { productoId: string; data: ProductoUpdate },
    TContext
  > => {
    const { mutation: mutationOptions, request: requestOptions } =
      options ?? {};

    const mutationFn: MutationFunction<
      Awaited<
        ReturnType<typeof actualizarProductoApiV1ProductosProductoIdPatch>
      >,
      { productoId: string; data: ProductoUpdate }
    > = (props) => {
      const { productoId, data } = props ?? {};

      return actualizarProductoApiV1ProductosProductoIdPatch(
        productoId,
        data,
        requestOptions,
      );
    };

    return { mutationFn, ...mutationOptions };
  };

export type ActualizarProductoApiV1ProductosProductoIdPatchMutationResult =
  NonNullable<
    Awaited<ReturnType<typeof actualizarProductoApiV1ProductosProductoIdPatch>>
  >;
export type ActualizarProductoApiV1ProductosProductoIdPatchMutationBody =
  ProductoUpdate;
export type ActualizarProductoApiV1ProductosProductoIdPatchMutationError =
  HTTPValidationError;

/**
 * @summary Actualizar Producto
 */
export const useActualizarProductoApiV1ProductosProductoIdPatch = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof actualizarProductoApiV1ProductosProductoIdPatch>>,
    TError,
    { productoId: string; data: ProductoUpdate },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof actualizarProductoApiV1ProductosProductoIdPatch>>,
  TError,
  { productoId: string; data: ProductoUpdate },
  TContext
> => {
  const mutationOptions =
    getActualizarProductoApiV1ProductosProductoIdPatchMutationOptions(options);

  return useMutation(mutationOptions);
};
/**
 * Elimina un producto (soft delete: marca como inactivo)
Validaciones Multi-Tenant aplicadas
 * @summary Eliminar Producto
 */
export const eliminarProductoApiV1ProductosProductoIdDelete = (
  productoId: string,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<void>(
    { url: `/api/v1/productos/${productoId}`, method: "DELETE" },
    options,
  );
};

export const getEliminarProductoApiV1ProductosProductoIdDeleteMutationOptions =
  <TError = HTTPValidationError, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<
      Awaited<
        ReturnType<typeof eliminarProductoApiV1ProductosProductoIdDelete>
      >,
      TError,
      { productoId: string },
      TContext
    >;
    request?: SecondParameter<typeof customInstance>;
  }): UseMutationOptions<
    Awaited<ReturnType<typeof eliminarProductoApiV1ProductosProductoIdDelete>>,
    TError,
    { productoId: string },
    TContext
  > => {
    const { mutation: mutationOptions, request: requestOptions } =
      options ?? {};

    const mutationFn: MutationFunction<
      Awaited<
        ReturnType<typeof eliminarProductoApiV1ProductosProductoIdDelete>
      >,
      { productoId: string }
    > = (props) => {
      const { productoId } = props ?? {};

      return eliminarProductoApiV1ProductosProductoIdDelete(
        productoId,
        requestOptions,
      );
    };

    return { mutationFn, ...mutationOptions };
  };

export type EliminarProductoApiV1ProductosProductoIdDeleteMutationResult =
  NonNullable<
    Awaited<ReturnType<typeof eliminarProductoApiV1ProductosProductoIdDelete>>
  >;

export type EliminarProductoApiV1ProductosProductoIdDeleteMutationError =
  HTTPValidationError;

/**
 * @summary Eliminar Producto
 */
export const useEliminarProductoApiV1ProductosProductoIdDelete = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof eliminarProductoApiV1ProductosProductoIdDelete>>,
    TError,
    { productoId: string },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof eliminarProductoApiV1ProductosProductoIdDelete>>,
  TError,
  { productoId: string },
  TContext
> => {
  const mutationOptions =
    getEliminarProductoApiV1ProductosProductoIdDeleteMutationOptions(options);

  return useMutation(mutationOptions);
};
/**
 * Busca un producto por SKU dentro de la tienda actual
Útil para sistemas de punto de venta con escáner de códigos
 * @summary Buscar Por Sku
 */
export const buscarPorSkuApiV1ProductosSkuSkuGet = (
  sku: string,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<ProductoReadWithCalculatedStock>(
    { url: `/api/v1/productos/sku/${sku}`, method: "GET", signal },
    options,
  );
};

export const getBuscarPorSkuApiV1ProductosSkuSkuGetQueryKey = (sku: string) => {
  return [`/api/v1/productos/sku/${sku}`] as const;
};

export const getBuscarPorSkuApiV1ProductosSkuSkuGetQueryOptions = <
  TData = Awaited<ReturnType<typeof buscarPorSkuApiV1ProductosSkuSkuGet>>,
  TError = HTTPValidationError,
>(
  sku: string,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof buscarPorSkuApiV1ProductosSkuSkuGet>>,
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
    getBuscarPorSkuApiV1ProductosSkuSkuGetQueryKey(sku);

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof buscarPorSkuApiV1ProductosSkuSkuGet>>
  > = ({ signal }) =>
    buscarPorSkuApiV1ProductosSkuSkuGet(sku, requestOptions, signal);

  return {
    queryKey,
    queryFn,
    enabled: !!sku,
    ...queryOptions,
  } as UseQueryOptions<
    Awaited<ReturnType<typeof buscarPorSkuApiV1ProductosSkuSkuGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type BuscarPorSkuApiV1ProductosSkuSkuGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof buscarPorSkuApiV1ProductosSkuSkuGet>>
>;
export type BuscarPorSkuApiV1ProductosSkuSkuGetQueryError = HTTPValidationError;

/**
 * @summary Buscar Por Sku
 */
export const useBuscarPorSkuApiV1ProductosSkuSkuGet = <
  TData = Awaited<ReturnType<typeof buscarPorSkuApiV1ProductosSkuSkuGet>>,
  TError = HTTPValidationError,
>(
  sku: string,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof buscarPorSkuApiV1ProductosSkuSkuGet>>,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getBuscarPorSkuApiV1ProductosSkuSkuGetQueryOptions(
    sku,
    options,
  );

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};
