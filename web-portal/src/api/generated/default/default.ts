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
import { customInstance } from "../../custom-instance";

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Health check endpoint
 * @summary Root
 */
export const rootGet = (
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<unknown>({ url: `/`, method: "GET", signal }, options);
};

export const getRootGetQueryKey = () => {
  return [`/`] as const;
};

export const getRootGetQueryOptions = <
  TData = Awaited<ReturnType<typeof rootGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<Awaited<ReturnType<typeof rootGet>>, TError, TData>
  >;
  request?: SecondParameter<typeof customInstance>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = queryOptions?.queryKey ?? getRootGetQueryKey();

  const queryFn: QueryFunction<Awaited<ReturnType<typeof rootGet>>> = ({
    signal,
  }) => rootGet(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof rootGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type RootGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof rootGet>>
>;
export type RootGetQueryError = unknown;

/**
 * @summary Root
 */
export const useRootGet = <
  TData = Awaited<ReturnType<typeof rootGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<Awaited<ReturnType<typeof rootGet>>, TError, TData>
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getRootGetQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};

/**
 * Endpoint de salud para monitoreo
 * @summary Health Check
 */
export const healthCheckHealthGet = (
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<unknown>(
    { url: `/health`, method: "GET", signal },
    options,
  );
};

export const getHealthCheckHealthGetQueryKey = () => {
  return [`/health`] as const;
};

export const getHealthCheckHealthGetQueryOptions = <
  TData = Awaited<ReturnType<typeof healthCheckHealthGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof healthCheckHealthGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = queryOptions?.queryKey ?? getHealthCheckHealthGetQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof healthCheckHealthGet>>
  > = ({ signal }) => healthCheckHealthGet(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof healthCheckHealthGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type HealthCheckHealthGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof healthCheckHealthGet>>
>;
export type HealthCheckHealthGetQueryError = unknown;

/**
 * @summary Health Check
 */
export const useHealthCheckHealthGet = <
  TData = Awaited<ReturnType<typeof healthCheckHealthGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof healthCheckHealthGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getHealthCheckHealthGetQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};
