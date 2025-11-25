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
 * Health check básico (liveness probe)
Solo verifica que la aplicación esté corriendo
 * @summary Health Check Basic
 */
export const healthCheckBasicApiV1HealthGet = (
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<unknown>(
    { url: `/api/v1/health/`, method: "GET", signal },
    options,
  );
};

export const getHealthCheckBasicApiV1HealthGetQueryKey = () => {
  return [`/api/v1/health/`] as const;
};

export const getHealthCheckBasicApiV1HealthGetQueryOptions = <
  TData = Awaited<ReturnType<typeof healthCheckBasicApiV1HealthGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof healthCheckBasicApiV1HealthGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey =
    queryOptions?.queryKey ?? getHealthCheckBasicApiV1HealthGetQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof healthCheckBasicApiV1HealthGet>>
  > = ({ signal }) => healthCheckBasicApiV1HealthGet(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof healthCheckBasicApiV1HealthGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type HealthCheckBasicApiV1HealthGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof healthCheckBasicApiV1HealthGet>>
>;
export type HealthCheckBasicApiV1HealthGetQueryError = unknown;

/**
 * @summary Health Check Basic
 */
export const useHealthCheckBasicApiV1HealthGet = <
  TData = Awaited<ReturnType<typeof healthCheckBasicApiV1HealthGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof healthCheckBasicApiV1HealthGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getHealthCheckBasicApiV1HealthGetQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};

/**
 * Readiness probe - verifica que todos los servicios críticos estén listos

Retorna 200 si está listo, 503 si no
 * @summary Readiness Check
 */
export const readinessCheckApiV1HealthReadyGet = (
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<unknown>(
    { url: `/api/v1/health/ready`, method: "GET", signal },
    options,
  );
};

export const getReadinessCheckApiV1HealthReadyGetQueryKey = () => {
  return [`/api/v1/health/ready`] as const;
};

export const getReadinessCheckApiV1HealthReadyGetQueryOptions = <
  TData = Awaited<ReturnType<typeof readinessCheckApiV1HealthReadyGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof readinessCheckApiV1HealthReadyGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey =
    queryOptions?.queryKey ?? getReadinessCheckApiV1HealthReadyGetQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof readinessCheckApiV1HealthReadyGet>>
  > = ({ signal }) => readinessCheckApiV1HealthReadyGet(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof readinessCheckApiV1HealthReadyGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type ReadinessCheckApiV1HealthReadyGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof readinessCheckApiV1HealthReadyGet>>
>;
export type ReadinessCheckApiV1HealthReadyGetQueryError = unknown;

/**
 * @summary Readiness Check
 */
export const useReadinessCheckApiV1HealthReadyGet = <
  TData = Awaited<ReturnType<typeof readinessCheckApiV1HealthReadyGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof readinessCheckApiV1HealthReadyGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions =
    getReadinessCheckApiV1HealthReadyGetQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};

/**
 * Métricas del sistema para monitoreo

Incluye:
- Uso de base de datos
- Estadísticas de requests
- Uptime
 * @summary System Metrics
 */
export const systemMetricsApiV1HealthMetricsGet = (
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<unknown>(
    { url: `/api/v1/health/metrics`, method: "GET", signal },
    options,
  );
};

export const getSystemMetricsApiV1HealthMetricsGetQueryKey = () => {
  return [`/api/v1/health/metrics`] as const;
};

export const getSystemMetricsApiV1HealthMetricsGetQueryOptions = <
  TData = Awaited<ReturnType<typeof systemMetricsApiV1HealthMetricsGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof systemMetricsApiV1HealthMetricsGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey =
    queryOptions?.queryKey ?? getSystemMetricsApiV1HealthMetricsGetQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof systemMetricsApiV1HealthMetricsGet>>
  > = ({ signal }) =>
    systemMetricsApiV1HealthMetricsGet(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof systemMetricsApiV1HealthMetricsGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type SystemMetricsApiV1HealthMetricsGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof systemMetricsApiV1HealthMetricsGet>>
>;
export type SystemMetricsApiV1HealthMetricsGetQueryError = unknown;

/**
 * @summary System Metrics
 */
export const useSystemMetricsApiV1HealthMetricsGet = <
  TData = Awaited<ReturnType<typeof systemMetricsApiV1HealthMetricsGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof systemMetricsApiV1HealthMetricsGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions =
    getSystemMetricsApiV1HealthMetricsGetQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};

/**
 * Estado de los Circuit Breakers

🛡️ Monitorea la salud de integraciones externas (MercadoPago, AFIP)

Estados posibles:
- CLOSED: Funcionamiento normal
- OPEN: Servicio no disponible, usando fallback
- HALF_OPEN: Probando recuperación

Returns:
    Estado de cada circuit breaker con métricas
 * @summary Circuit Breakers Status
 */
export const circuitBreakersStatusApiV1HealthCircuitsGet = (
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<unknown>(
    { url: `/api/v1/health/circuits`, method: "GET", signal },
    options,
  );
};

export const getCircuitBreakersStatusApiV1HealthCircuitsGetQueryKey = () => {
  return [`/api/v1/health/circuits`] as const;
};

export const getCircuitBreakersStatusApiV1HealthCircuitsGetQueryOptions = <
  TData = Awaited<
    ReturnType<typeof circuitBreakersStatusApiV1HealthCircuitsGet>
  >,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof circuitBreakersStatusApiV1HealthCircuitsGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey =
    queryOptions?.queryKey ??
    getCircuitBreakersStatusApiV1HealthCircuitsGetQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof circuitBreakersStatusApiV1HealthCircuitsGet>>
  > = ({ signal }) =>
    circuitBreakersStatusApiV1HealthCircuitsGet(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof circuitBreakersStatusApiV1HealthCircuitsGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type CircuitBreakersStatusApiV1HealthCircuitsGetQueryResult =
  NonNullable<
    Awaited<ReturnType<typeof circuitBreakersStatusApiV1HealthCircuitsGet>>
  >;
export type CircuitBreakersStatusApiV1HealthCircuitsGetQueryError = unknown;

/**
 * @summary Circuit Breakers Status
 */
export const useCircuitBreakersStatusApiV1HealthCircuitsGet = <
  TData = Awaited<
    ReturnType<typeof circuitBreakersStatusApiV1HealthCircuitsGet>
  >,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof circuitBreakersStatusApiV1HealthCircuitsGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions =
    getCircuitBreakersStatusApiV1HealthCircuitsGetQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};
