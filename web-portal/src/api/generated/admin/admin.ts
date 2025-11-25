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
  ListUsuariosApiV1AdminUsuariosGetParams,
  OnboardingData,
  OnboardingResponse,
  TiendaCreate,
  TiendaResponse,
  UsuarioCreate,
  UsuarioResponse,
} from ".././models";
import { customInstance } from "../../custom-instance";

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Listar todas las tiendas del sistema
 * @summary List Tiendas
 */
export const listTiendasApiV1AdminTiendasGet = (
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<TiendaResponse[]>(
    { url: `/api/v1/admin/tiendas`, method: "GET", signal },
    options,
  );
};

export const getListTiendasApiV1AdminTiendasGetQueryKey = () => {
  return [`/api/v1/admin/tiendas`] as const;
};

export const getListTiendasApiV1AdminTiendasGetQueryOptions = <
  TData = Awaited<ReturnType<typeof listTiendasApiV1AdminTiendasGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof listTiendasApiV1AdminTiendasGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey =
    queryOptions?.queryKey ?? getListTiendasApiV1AdminTiendasGetQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof listTiendasApiV1AdminTiendasGet>>
  > = ({ signal }) => listTiendasApiV1AdminTiendasGet(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof listTiendasApiV1AdminTiendasGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type ListTiendasApiV1AdminTiendasGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof listTiendasApiV1AdminTiendasGet>>
>;
export type ListTiendasApiV1AdminTiendasGetQueryError = unknown;

/**
 * @summary List Tiendas
 */
export const useListTiendasApiV1AdminTiendasGet = <
  TData = Awaited<ReturnType<typeof listTiendasApiV1AdminTiendasGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof listTiendasApiV1AdminTiendasGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getListTiendasApiV1AdminTiendasGetQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};

/**
 * Crear una nueva tienda
 * @summary Create Tienda
 */
export const createTiendaApiV1AdminTiendasPost = (
  tiendaCreate: TiendaCreate,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<TiendaResponse>(
    {
      url: `/api/v1/admin/tiendas`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: tiendaCreate,
    },
    options,
  );
};

export const getCreateTiendaApiV1AdminTiendasPostMutationOptions = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof createTiendaApiV1AdminTiendasPost>>,
    TError,
    { data: TiendaCreate },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof createTiendaApiV1AdminTiendasPost>>,
  TError,
  { data: TiendaCreate },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof createTiendaApiV1AdminTiendasPost>>,
    { data: TiendaCreate }
  > = (props) => {
    const { data } = props ?? {};

    return createTiendaApiV1AdminTiendasPost(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type CreateTiendaApiV1AdminTiendasPostMutationResult = NonNullable<
  Awaited<ReturnType<typeof createTiendaApiV1AdminTiendasPost>>
>;
export type CreateTiendaApiV1AdminTiendasPostMutationBody = TiendaCreate;
export type CreateTiendaApiV1AdminTiendasPostMutationError =
  HTTPValidationError;

/**
 * @summary Create Tienda
 */
export const useCreateTiendaApiV1AdminTiendasPost = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof createTiendaApiV1AdminTiendasPost>>,
    TError,
    { data: TiendaCreate },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof createTiendaApiV1AdminTiendasPost>>,
  TError,
  { data: TiendaCreate },
  TContext
> => {
  const mutationOptions =
    getCreateTiendaApiV1AdminTiendasPostMutationOptions(options);

  return useMutation(mutationOptions);
};
/**
 * Listar usuarios (opcionalmente filtrados por tienda)
 * @summary List Usuarios
 */
export const listUsuariosApiV1AdminUsuariosGet = (
  params?: ListUsuariosApiV1AdminUsuariosGetParams,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<UsuarioResponse[]>(
    { url: `/api/v1/admin/usuarios`, method: "GET", params, signal },
    options,
  );
};

export const getListUsuariosApiV1AdminUsuariosGetQueryKey = (
  params?: ListUsuariosApiV1AdminUsuariosGetParams,
) => {
  return [`/api/v1/admin/usuarios`, ...(params ? [params] : [])] as const;
};

export const getListUsuariosApiV1AdminUsuariosGetQueryOptions = <
  TData = Awaited<ReturnType<typeof listUsuariosApiV1AdminUsuariosGet>>,
  TError = HTTPValidationError,
>(
  params?: ListUsuariosApiV1AdminUsuariosGetParams,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof listUsuariosApiV1AdminUsuariosGet>>,
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
    getListUsuariosApiV1AdminUsuariosGetQueryKey(params);

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof listUsuariosApiV1AdminUsuariosGet>>
  > = ({ signal }) =>
    listUsuariosApiV1AdminUsuariosGet(params, requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof listUsuariosApiV1AdminUsuariosGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type ListUsuariosApiV1AdminUsuariosGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof listUsuariosApiV1AdminUsuariosGet>>
>;
export type ListUsuariosApiV1AdminUsuariosGetQueryError = HTTPValidationError;

/**
 * @summary List Usuarios
 */
export const useListUsuariosApiV1AdminUsuariosGet = <
  TData = Awaited<ReturnType<typeof listUsuariosApiV1AdminUsuariosGet>>,
  TError = HTTPValidationError,
>(
  params?: ListUsuariosApiV1AdminUsuariosGetParams,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof listUsuariosApiV1AdminUsuariosGet>>,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getListUsuariosApiV1AdminUsuariosGetQueryOptions(
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
 * Crear un nuevo usuario para una tienda
 * @summary Create Usuario
 */
export const createUsuarioApiV1AdminUsuariosPost = (
  usuarioCreate: UsuarioCreate,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<UsuarioResponse>(
    {
      url: `/api/v1/admin/usuarios`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: usuarioCreate,
    },
    options,
  );
};

export const getCreateUsuarioApiV1AdminUsuariosPostMutationOptions = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof createUsuarioApiV1AdminUsuariosPost>>,
    TError,
    { data: UsuarioCreate },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof createUsuarioApiV1AdminUsuariosPost>>,
  TError,
  { data: UsuarioCreate },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof createUsuarioApiV1AdminUsuariosPost>>,
    { data: UsuarioCreate }
  > = (props) => {
    const { data } = props ?? {};

    return createUsuarioApiV1AdminUsuariosPost(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type CreateUsuarioApiV1AdminUsuariosPostMutationResult = NonNullable<
  Awaited<ReturnType<typeof createUsuarioApiV1AdminUsuariosPost>>
>;
export type CreateUsuarioApiV1AdminUsuariosPostMutationBody = UsuarioCreate;
export type CreateUsuarioApiV1AdminUsuariosPostMutationError =
  HTTPValidationError;

/**
 * @summary Create Usuario
 */
export const useCreateUsuarioApiV1AdminUsuariosPost = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof createUsuarioApiV1AdminUsuariosPost>>,
    TError,
    { data: UsuarioCreate },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof createUsuarioApiV1AdminUsuariosPost>>,
  TError,
  { data: UsuarioCreate },
  TContext
> => {
  const mutationOptions =
    getCreateUsuarioApiV1AdminUsuariosPostMutationOptions(options);

  return useMutation(mutationOptions);
};
/**
 * Desactivar un usuario (soft delete)
 * @summary Delete Usuario
 */
export const deleteUsuarioApiV1AdminUsuariosUsuarioIdDelete = (
  usuarioId: string,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<unknown>(
    { url: `/api/v1/admin/usuarios/${usuarioId}`, method: "DELETE" },
    options,
  );
};

export const getDeleteUsuarioApiV1AdminUsuariosUsuarioIdDeleteMutationOptions =
  <TError = HTTPValidationError, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<
      Awaited<
        ReturnType<typeof deleteUsuarioApiV1AdminUsuariosUsuarioIdDelete>
      >,
      TError,
      { usuarioId: string },
      TContext
    >;
    request?: SecondParameter<typeof customInstance>;
  }): UseMutationOptions<
    Awaited<ReturnType<typeof deleteUsuarioApiV1AdminUsuariosUsuarioIdDelete>>,
    TError,
    { usuarioId: string },
    TContext
  > => {
    const { mutation: mutationOptions, request: requestOptions } =
      options ?? {};

    const mutationFn: MutationFunction<
      Awaited<
        ReturnType<typeof deleteUsuarioApiV1AdminUsuariosUsuarioIdDelete>
      >,
      { usuarioId: string }
    > = (props) => {
      const { usuarioId } = props ?? {};

      return deleteUsuarioApiV1AdminUsuariosUsuarioIdDelete(
        usuarioId,
        requestOptions,
      );
    };

    return { mutationFn, ...mutationOptions };
  };

export type DeleteUsuarioApiV1AdminUsuariosUsuarioIdDeleteMutationResult =
  NonNullable<
    Awaited<ReturnType<typeof deleteUsuarioApiV1AdminUsuariosUsuarioIdDelete>>
  >;

export type DeleteUsuarioApiV1AdminUsuariosUsuarioIdDeleteMutationError =
  HTTPValidationError;

/**
 * @summary Delete Usuario
 */
export const useDeleteUsuarioApiV1AdminUsuariosUsuarioIdDelete = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof deleteUsuarioApiV1AdminUsuariosUsuarioIdDelete>>,
    TError,
    { usuarioId: string },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof deleteUsuarioApiV1AdminUsuariosUsuarioIdDelete>>,
  TError,
  { usuarioId: string },
  TContext
> => {
  const mutationOptions =
    getDeleteUsuarioApiV1AdminUsuariosUsuarioIdDeleteMutationOptions(options);

  return useMutation(mutationOptions);
};
/**
 * Reactivar un usuario desactivado
 * @summary Activate Usuario
 */
export const activateUsuarioApiV1AdminUsuariosUsuarioIdActivatePatch = (
  usuarioId: string,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<unknown>(
    { url: `/api/v1/admin/usuarios/${usuarioId}/activate`, method: "PATCH" },
    options,
  );
};

export const getActivateUsuarioApiV1AdminUsuariosUsuarioIdActivatePatchMutationOptions =
  <TError = HTTPValidationError, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<
      Awaited<
        ReturnType<
          typeof activateUsuarioApiV1AdminUsuariosUsuarioIdActivatePatch
        >
      >,
      TError,
      { usuarioId: string },
      TContext
    >;
    request?: SecondParameter<typeof customInstance>;
  }): UseMutationOptions<
    Awaited<
      ReturnType<typeof activateUsuarioApiV1AdminUsuariosUsuarioIdActivatePatch>
    >,
    TError,
    { usuarioId: string },
    TContext
  > => {
    const { mutation: mutationOptions, request: requestOptions } =
      options ?? {};

    const mutationFn: MutationFunction<
      Awaited<
        ReturnType<
          typeof activateUsuarioApiV1AdminUsuariosUsuarioIdActivatePatch
        >
      >,
      { usuarioId: string }
    > = (props) => {
      const { usuarioId } = props ?? {};

      return activateUsuarioApiV1AdminUsuariosUsuarioIdActivatePatch(
        usuarioId,
        requestOptions,
      );
    };

    return { mutationFn, ...mutationOptions };
  };

export type ActivateUsuarioApiV1AdminUsuariosUsuarioIdActivatePatchMutationResult =
  NonNullable<
    Awaited<
      ReturnType<typeof activateUsuarioApiV1AdminUsuariosUsuarioIdActivatePatch>
    >
  >;

export type ActivateUsuarioApiV1AdminUsuariosUsuarioIdActivatePatchMutationError =
  HTTPValidationError;

/**
 * @summary Activate Usuario
 */
export const useActivateUsuarioApiV1AdminUsuariosUsuarioIdActivatePatch = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<
      ReturnType<typeof activateUsuarioApiV1AdminUsuariosUsuarioIdActivatePatch>
    >,
    TError,
    { usuarioId: string },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<
    ReturnType<typeof activateUsuarioApiV1AdminUsuariosUsuarioIdActivatePatch>
  >,
  TError,
  { usuarioId: string },
  TContext
> => {
  const mutationOptions =
    getActivateUsuarioApiV1AdminUsuariosUsuarioIdActivatePatchMutationOptions(
      options,
    );

  return useMutation(mutationOptions);
};
/**
 * 🎯 Endpoint combinado: Crear tienda + usuario dueño en un solo paso
Ideal para dar de alta rápidamente a nuevos clientes como "Pedrito el verdulero"
 * @summary Onboarding Tienda
 */
export const onboardingTiendaApiV1AdminOnboardingPost = (
  onboardingData: OnboardingData,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<OnboardingResponse>(
    {
      url: `/api/v1/admin/onboarding`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: onboardingData,
    },
    options,
  );
};

export const getOnboardingTiendaApiV1AdminOnboardingPostMutationOptions = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof onboardingTiendaApiV1AdminOnboardingPost>>,
    TError,
    { data: OnboardingData },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof onboardingTiendaApiV1AdminOnboardingPost>>,
  TError,
  { data: OnboardingData },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof onboardingTiendaApiV1AdminOnboardingPost>>,
    { data: OnboardingData }
  > = (props) => {
    const { data } = props ?? {};

    return onboardingTiendaApiV1AdminOnboardingPost(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type OnboardingTiendaApiV1AdminOnboardingPostMutationResult =
  NonNullable<
    Awaited<ReturnType<typeof onboardingTiendaApiV1AdminOnboardingPost>>
  >;
export type OnboardingTiendaApiV1AdminOnboardingPostMutationBody =
  OnboardingData;
export type OnboardingTiendaApiV1AdminOnboardingPostMutationError =
  HTTPValidationError;

/**
 * @summary Onboarding Tienda
 */
export const useOnboardingTiendaApiV1AdminOnboardingPost = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof onboardingTiendaApiV1AdminOnboardingPost>>,
    TError,
    { data: OnboardingData },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof onboardingTiendaApiV1AdminOnboardingPost>>,
  TError,
  { data: OnboardingData },
  TContext
> => {
  const mutationOptions =
    getOnboardingTiendaApiV1AdminOnboardingPostMutationOptions(options);

  return useMutation(mutationOptions);
};
