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
  GetMiTiendaApiV1TiendasMeGet200,
  HTTPValidationError,
  TiendaUpdate,
  UpdateMiTiendaApiV1TiendasMePatch200,
} from ".././models";
import { customInstance } from "../../custom-instance";

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Obtener información de mi tienda actual
 * @summary Get Mi Tienda
 */
export const getMiTiendaApiV1TiendasMeGet = (
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<GetMiTiendaApiV1TiendasMeGet200>(
    { url: `/api/v1/tiendas/me`, method: "GET", signal },
    options,
  );
};

export const getGetMiTiendaApiV1TiendasMeGetQueryKey = () => {
  return [`/api/v1/tiendas/me`] as const;
};

export const getGetMiTiendaApiV1TiendasMeGetQueryOptions = <
  TData = Awaited<ReturnType<typeof getMiTiendaApiV1TiendasMeGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof getMiTiendaApiV1TiendasMeGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey =
    queryOptions?.queryKey ?? getGetMiTiendaApiV1TiendasMeGetQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof getMiTiendaApiV1TiendasMeGet>>
  > = ({ signal }) => getMiTiendaApiV1TiendasMeGet(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getMiTiendaApiV1TiendasMeGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type GetMiTiendaApiV1TiendasMeGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof getMiTiendaApiV1TiendasMeGet>>
>;
export type GetMiTiendaApiV1TiendasMeGetQueryError = unknown;

/**
 * @summary Get Mi Tienda
 */
export const useGetMiTiendaApiV1TiendasMeGet = <
  TData = Awaited<ReturnType<typeof getMiTiendaApiV1TiendasMeGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof getMiTiendaApiV1TiendasMeGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getGetMiTiendaApiV1TiendasMeGetQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};

/**
 * Actualizar información de mi tienda
Útil para el onboarding y cambio de rubro
 * @summary Update Mi Tienda
 */
export const updateMiTiendaApiV1TiendasMePatch = (
  tiendaUpdate: TiendaUpdate,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<UpdateMiTiendaApiV1TiendasMePatch200>(
    {
      url: `/api/v1/tiendas/me`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: tiendaUpdate,
    },
    options,
  );
};

export const getUpdateMiTiendaApiV1TiendasMePatchMutationOptions = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof updateMiTiendaApiV1TiendasMePatch>>,
    TError,
    { data: TiendaUpdate },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof updateMiTiendaApiV1TiendasMePatch>>,
  TError,
  { data: TiendaUpdate },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof updateMiTiendaApiV1TiendasMePatch>>,
    { data: TiendaUpdate }
  > = (props) => {
    const { data } = props ?? {};

    return updateMiTiendaApiV1TiendasMePatch(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type UpdateMiTiendaApiV1TiendasMePatchMutationResult = NonNullable<
  Awaited<ReturnType<typeof updateMiTiendaApiV1TiendasMePatch>>
>;
export type UpdateMiTiendaApiV1TiendasMePatchMutationBody = TiendaUpdate;
export type UpdateMiTiendaApiV1TiendasMePatchMutationError =
  HTTPValidationError;

/**
 * @summary Update Mi Tienda
 */
export const useUpdateMiTiendaApiV1TiendasMePatch = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof updateMiTiendaApiV1TiendasMePatch>>,
    TError,
    { data: TiendaUpdate },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof updateMiTiendaApiV1TiendasMePatch>>,
  TError,
  { data: TiendaUpdate },
  TContext
> => {
  const mutationOptions =
    getUpdateMiTiendaApiV1TiendasMePatchMutationOptions(options);

  return useMutation(mutationOptions);
};
