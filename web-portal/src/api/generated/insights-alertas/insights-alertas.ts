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
  EstadisticasInsightsApiV1InsightsStatsGet200,
  HTTPValidationError,
  InsightRead,
  InsightRefreshResponse,
  LimpiarInsightsApiV1InsightsClearAllDeleteParams,
  ListarInsightsApiV1InsightsGetParams,
  RefrescarInsightsApiV1InsightsRefreshPostParams,
  RefrescarInsightsBackgroundApiV1InsightsBackgroundRefreshPost202,
} from ".././models";
import { customInstance } from "../../custom-instance";

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Lista los insights de la tienda ordenados por urgencia y fecha

Ordenamiento:
1. Por urgencia (CRITICA > ALTA > MEDIA > BAJA)
2. Por fecha de creación (más recientes primero)

Filtros:
- activos_solo: Mostrar solo activos (por defecto True)
- nivel_urgencia: Filtrar por nivel específico
- tipo: Filtrar por tipo específico
 * @summary Listar Insights
 */
export const listarInsightsApiV1InsightsGet = (
  params?: ListarInsightsApiV1InsightsGetParams,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<InsightRead[]>(
    { url: `/api/v1/insights/`, method: "GET", params, signal },
    options,
  );
};

export const getListarInsightsApiV1InsightsGetQueryKey = (
  params?: ListarInsightsApiV1InsightsGetParams,
) => {
  return [`/api/v1/insights/`, ...(params ? [params] : [])] as const;
};

export const getListarInsightsApiV1InsightsGetQueryOptions = <
  TData = Awaited<ReturnType<typeof listarInsightsApiV1InsightsGet>>,
  TError = HTTPValidationError,
>(
  params?: ListarInsightsApiV1InsightsGetParams,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof listarInsightsApiV1InsightsGet>>,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey =
    queryOptions?.queryKey ?? getListarInsightsApiV1InsightsGetQueryKey(params);

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof listarInsightsApiV1InsightsGet>>
  > = ({ signal }) =>
    listarInsightsApiV1InsightsGet(params, requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof listarInsightsApiV1InsightsGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type ListarInsightsApiV1InsightsGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof listarInsightsApiV1InsightsGet>>
>;
export type ListarInsightsApiV1InsightsGetQueryError = HTTPValidationError;

/**
 * @summary Listar Insights
 */
export const useListarInsightsApiV1InsightsGet = <
  TData = Awaited<ReturnType<typeof listarInsightsApiV1InsightsGet>>,
  TError = HTTPValidationError,
>(
  params?: ListarInsightsApiV1InsightsGetParams,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof listarInsightsApiV1InsightsGet>>,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getListarInsightsApiV1InsightsGetQueryOptions(
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
 * Archiva un insight (marca como inactivo)

Útil cuando el usuario ya vio la alerta o tomó acción

Validaciones:
- El insight debe pertenecer a la tienda actual
- Multi-Tenant security
 * @summary Archivar Insight
 */
export const archivarInsightApiV1InsightsInsightIdDismissPost = (
  insightId: string,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<void>(
    { url: `/api/v1/insights/${insightId}/dismiss`, method: "POST" },
    options,
  );
};

export const getArchivarInsightApiV1InsightsInsightIdDismissPostMutationOptions =
  <TError = HTTPValidationError, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<
      Awaited<
        ReturnType<typeof archivarInsightApiV1InsightsInsightIdDismissPost>
      >,
      TError,
      { insightId: string },
      TContext
    >;
    request?: SecondParameter<typeof customInstance>;
  }): UseMutationOptions<
    Awaited<
      ReturnType<typeof archivarInsightApiV1InsightsInsightIdDismissPost>
    >,
    TError,
    { insightId: string },
    TContext
  > => {
    const { mutation: mutationOptions, request: requestOptions } =
      options ?? {};

    const mutationFn: MutationFunction<
      Awaited<
        ReturnType<typeof archivarInsightApiV1InsightsInsightIdDismissPost>
      >,
      { insightId: string }
    > = (props) => {
      const { insightId } = props ?? {};

      return archivarInsightApiV1InsightsInsightIdDismissPost(
        insightId,
        requestOptions,
      );
    };

    return { mutationFn, ...mutationOptions };
  };

export type ArchivarInsightApiV1InsightsInsightIdDismissPostMutationResult =
  NonNullable<
    Awaited<ReturnType<typeof archivarInsightApiV1InsightsInsightIdDismissPost>>
  >;

export type ArchivarInsightApiV1InsightsInsightIdDismissPostMutationError =
  HTTPValidationError;

/**
 * @summary Archivar Insight
 */
export const useArchivarInsightApiV1InsightsInsightIdDismissPost = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<
      ReturnType<typeof archivarInsightApiV1InsightsInsightIdDismissPost>
    >,
    TError,
    { insightId: string },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof archivarInsightApiV1InsightsInsightIdDismissPost>>,
  TError,
  { insightId: string },
  TContext
> => {
  const mutationOptions =
    getArchivarInsightApiV1InsightsInsightIdDismissPostMutationOptions(options);

  return useMutation(mutationOptions);
};
/**
 * Endpoint para forzar la generación de insights manualmente

Útil para:
- Demos y pruebas
- Refresh manual desde el dashboard
- Testing de la lógica de insights

Args:
    force: Si es True, genera insights aunque ya existan recientes
           (útil para testing, pero puede crear duplicados)

Returns:
    Resumen de insights generados
 * @summary Refrescar Insights
 */
export const refrescarInsightsApiV1InsightsRefreshPost = (
  params?: RefrescarInsightsApiV1InsightsRefreshPostParams,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<InsightRefreshResponse>(
    { url: `/api/v1/insights/refresh`, method: "POST", params },
    options,
  );
};

export const getRefrescarInsightsApiV1InsightsRefreshPostMutationOptions = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof refrescarInsightsApiV1InsightsRefreshPost>>,
    TError,
    { params?: RefrescarInsightsApiV1InsightsRefreshPostParams },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof refrescarInsightsApiV1InsightsRefreshPost>>,
  TError,
  { params?: RefrescarInsightsApiV1InsightsRefreshPostParams },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof refrescarInsightsApiV1InsightsRefreshPost>>,
    { params?: RefrescarInsightsApiV1InsightsRefreshPostParams }
  > = (props) => {
    const { params } = props ?? {};

    return refrescarInsightsApiV1InsightsRefreshPost(params, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type RefrescarInsightsApiV1InsightsRefreshPostMutationResult =
  NonNullable<
    Awaited<ReturnType<typeof refrescarInsightsApiV1InsightsRefreshPost>>
  >;

export type RefrescarInsightsApiV1InsightsRefreshPostMutationError =
  HTTPValidationError;

/**
 * @summary Refrescar Insights
 */
export const useRefrescarInsightsApiV1InsightsRefreshPost = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof refrescarInsightsApiV1InsightsRefreshPost>>,
    TError,
    { params?: RefrescarInsightsApiV1InsightsRefreshPostParams },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof refrescarInsightsApiV1InsightsRefreshPost>>,
  TError,
  { params?: RefrescarInsightsApiV1InsightsRefreshPostParams },
  TContext
> => {
  const mutationOptions =
    getRefrescarInsightsApiV1InsightsRefreshPostMutationOptions(options);

  return useMutation(mutationOptions);
};
/**
 * Genera insights en segundo plano usando FastAPI BackgroundTasks

Retorna inmediatamente 202 Accepted mientras procesa en background

Ideal para no bloquear la respuesta del API cuando hay muchos datos
 * @summary Refrescar Insights Background
 */
export const refrescarInsightsBackgroundApiV1InsightsBackgroundRefreshPost = (
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<RefrescarInsightsBackgroundApiV1InsightsBackgroundRefreshPost202>(
    { url: `/api/v1/insights/background-refresh`, method: "POST" },
    options,
  );
};

export const getRefrescarInsightsBackgroundApiV1InsightsBackgroundRefreshPostMutationOptions =
  <TError = unknown, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<
      Awaited<
        ReturnType<
          typeof refrescarInsightsBackgroundApiV1InsightsBackgroundRefreshPost
        >
      >,
      TError,
      void,
      TContext
    >;
    request?: SecondParameter<typeof customInstance>;
  }): UseMutationOptions<
    Awaited<
      ReturnType<
        typeof refrescarInsightsBackgroundApiV1InsightsBackgroundRefreshPost
      >
    >,
    TError,
    void,
    TContext
  > => {
    const { mutation: mutationOptions, request: requestOptions } =
      options ?? {};

    const mutationFn: MutationFunction<
      Awaited<
        ReturnType<
          typeof refrescarInsightsBackgroundApiV1InsightsBackgroundRefreshPost
        >
      >,
      void
    > = () => {
      return refrescarInsightsBackgroundApiV1InsightsBackgroundRefreshPost(
        requestOptions,
      );
    };

    return { mutationFn, ...mutationOptions };
  };

export type RefrescarInsightsBackgroundApiV1InsightsBackgroundRefreshPostMutationResult =
  NonNullable<
    Awaited<
      ReturnType<
        typeof refrescarInsightsBackgroundApiV1InsightsBackgroundRefreshPost
      >
    >
  >;

export type RefrescarInsightsBackgroundApiV1InsightsBackgroundRefreshPostMutationError =
  unknown;

/**
 * @summary Refrescar Insights Background
 */
export const useRefrescarInsightsBackgroundApiV1InsightsBackgroundRefreshPost =
  <TError = unknown, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<
      Awaited<
        ReturnType<
          typeof refrescarInsightsBackgroundApiV1InsightsBackgroundRefreshPost
        >
      >,
      TError,
      void,
      TContext
    >;
    request?: SecondParameter<typeof customInstance>;
  }): UseMutationResult<
    Awaited<
      ReturnType<
        typeof refrescarInsightsBackgroundApiV1InsightsBackgroundRefreshPost
      >
    >,
    TError,
    void,
    TContext
  > => {
    const mutationOptions =
      getRefrescarInsightsBackgroundApiV1InsightsBackgroundRefreshPostMutationOptions(
        options,
      );

    return useMutation(mutationOptions);
  };
/**
 * Obtiene estadísticas de insights de la tienda

Returns:
    Contadores por tipo, urgencia y estado
 * @summary Estadisticas Insights
 */
export const estadisticasInsightsApiV1InsightsStatsGet = (
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<EstadisticasInsightsApiV1InsightsStatsGet200>(
    { url: `/api/v1/insights/stats`, method: "GET", signal },
    options,
  );
};

export const getEstadisticasInsightsApiV1InsightsStatsGetQueryKey = () => {
  return [`/api/v1/insights/stats`] as const;
};

export const getEstadisticasInsightsApiV1InsightsStatsGetQueryOptions = <
  TData = Awaited<ReturnType<typeof estadisticasInsightsApiV1InsightsStatsGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof estadisticasInsightsApiV1InsightsStatsGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey =
    queryOptions?.queryKey ??
    getEstadisticasInsightsApiV1InsightsStatsGetQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof estadisticasInsightsApiV1InsightsStatsGet>>
  > = ({ signal }) =>
    estadisticasInsightsApiV1InsightsStatsGet(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof estadisticasInsightsApiV1InsightsStatsGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type EstadisticasInsightsApiV1InsightsStatsGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof estadisticasInsightsApiV1InsightsStatsGet>>
>;
export type EstadisticasInsightsApiV1InsightsStatsGetQueryError = unknown;

/**
 * @summary Estadisticas Insights
 */
export const useEstadisticasInsightsApiV1InsightsStatsGet = <
  TData = Awaited<ReturnType<typeof estadisticasInsightsApiV1InsightsStatsGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof estadisticasInsightsApiV1InsightsStatsGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions =
    getEstadisticasInsightsApiV1InsightsStatsGetQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};

/**
 * Limpia insights de la tienda

Args:
    solo_archivados: Si es True, solo elimina los archivados
                    Si es False, elimina TODOS (usar con cuidado)

ATENCIÓN: Esta operación es irreversible
 * @summary Limpiar Insights
 */
export const limpiarInsightsApiV1InsightsClearAllDelete = (
  params?: LimpiarInsightsApiV1InsightsClearAllDeleteParams,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<void>(
    { url: `/api/v1/insights/clear-all`, method: "DELETE", params },
    options,
  );
};

export const getLimpiarInsightsApiV1InsightsClearAllDeleteMutationOptions = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof limpiarInsightsApiV1InsightsClearAllDelete>>,
    TError,
    { params?: LimpiarInsightsApiV1InsightsClearAllDeleteParams },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof limpiarInsightsApiV1InsightsClearAllDelete>>,
  TError,
  { params?: LimpiarInsightsApiV1InsightsClearAllDeleteParams },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof limpiarInsightsApiV1InsightsClearAllDelete>>,
    { params?: LimpiarInsightsApiV1InsightsClearAllDeleteParams }
  > = (props) => {
    const { params } = props ?? {};

    return limpiarInsightsApiV1InsightsClearAllDelete(params, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type LimpiarInsightsApiV1InsightsClearAllDeleteMutationResult =
  NonNullable<
    Awaited<ReturnType<typeof limpiarInsightsApiV1InsightsClearAllDelete>>
  >;

export type LimpiarInsightsApiV1InsightsClearAllDeleteMutationError =
  HTTPValidationError;

/**
 * @summary Limpiar Insights
 */
export const useLimpiarInsightsApiV1InsightsClearAllDelete = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof limpiarInsightsApiV1InsightsClearAllDelete>>,
    TError,
    { params?: LimpiarInsightsApiV1InsightsClearAllDeleteParams },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof limpiarInsightsApiV1InsightsClearAllDelete>>,
  TError,
  { params?: LimpiarInsightsApiV1InsightsClearAllDeleteParams },
  TContext
> => {
  const mutationOptions =
    getLimpiarInsightsApiV1InsightsClearAllDeleteMutationOptions(options);

  return useMutation(mutationOptions);
};
