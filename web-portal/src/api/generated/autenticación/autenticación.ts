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
  BodyLoginFormApiV1AuthLoginFormPost,
  GetCurrentUserInfoApiV1AuthMeGet200,
  HTTPValidationError,
  LoginRequest,
  Token,
} from ".././models";
import { customInstance } from "../../custom-instance";

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Endpoint de Login - OAuth2 Password Flow

Validaciones:
1. Usuario existe por email
2. Password es correcto
3. Usuario está activo

Returns:
    Token JWT con el user_id en el payload (sub)
 * @summary Login
 */
export const loginApiV1AuthLoginPost = (
  loginRequest: LoginRequest,
  options?: SecondParameter<typeof customInstance>,
) => {
  return customInstance<Token>(
    {
      url: `/api/v1/auth/login`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: loginRequest,
    },
    options,
  );
};

export const getLoginApiV1AuthLoginPostMutationOptions = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof loginApiV1AuthLoginPost>>,
    TError,
    { data: LoginRequest },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof loginApiV1AuthLoginPost>>,
  TError,
  { data: LoginRequest },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof loginApiV1AuthLoginPost>>,
    { data: LoginRequest }
  > = (props) => {
    const { data } = props ?? {};

    return loginApiV1AuthLoginPost(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type LoginApiV1AuthLoginPostMutationResult = NonNullable<
  Awaited<ReturnType<typeof loginApiV1AuthLoginPost>>
>;
export type LoginApiV1AuthLoginPostMutationBody = LoginRequest;
export type LoginApiV1AuthLoginPostMutationError = HTTPValidationError;

/**
 * @summary Login
 */
export const useLoginApiV1AuthLoginPost = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof loginApiV1AuthLoginPost>>,
    TError,
    { data: LoginRequest },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof loginApiV1AuthLoginPost>>,
  TError,
  { data: LoginRequest },
  TContext
> => {
  const mutationOptions = getLoginApiV1AuthLoginPostMutationOptions(options);

  return useMutation(mutationOptions);
};
/**
 * Login alternativo compatible con OAuth2PasswordRequestForm
Útil para Swagger UI y herramientas OAuth2 estándar
 * @summary Login Form
 */
export const loginFormApiV1AuthLoginFormPost = (
  bodyLoginFormApiV1AuthLoginFormPost: BodyLoginFormApiV1AuthLoginFormPost,
  options?: SecondParameter<typeof customInstance>,
) => {
  const formUrlEncoded = new URLSearchParams();
  if (bodyLoginFormApiV1AuthLoginFormPost.grant_type !== undefined) {
    formUrlEncoded.append(
      "grant_type",
      bodyLoginFormApiV1AuthLoginFormPost.grant_type,
    );
  }
  formUrlEncoded.append(
    "username",
    bodyLoginFormApiV1AuthLoginFormPost.username,
  );
  formUrlEncoded.append(
    "password",
    bodyLoginFormApiV1AuthLoginFormPost.password,
  );
  if (bodyLoginFormApiV1AuthLoginFormPost.scope !== undefined) {
    formUrlEncoded.append("scope", bodyLoginFormApiV1AuthLoginFormPost.scope);
  }
  if (bodyLoginFormApiV1AuthLoginFormPost.client_id !== undefined) {
    formUrlEncoded.append(
      "client_id",
      bodyLoginFormApiV1AuthLoginFormPost.client_id,
    );
  }
  if (bodyLoginFormApiV1AuthLoginFormPost.client_secret !== undefined) {
    formUrlEncoded.append(
      "client_secret",
      bodyLoginFormApiV1AuthLoginFormPost.client_secret,
    );
  }

  return customInstance<Token>(
    {
      url: `/api/v1/auth/login/form`,
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: formUrlEncoded,
    },
    options,
  );
};

export const getLoginFormApiV1AuthLoginFormPostMutationOptions = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof loginFormApiV1AuthLoginFormPost>>,
    TError,
    { data: BodyLoginFormApiV1AuthLoginFormPost },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof loginFormApiV1AuthLoginFormPost>>,
  TError,
  { data: BodyLoginFormApiV1AuthLoginFormPost },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof loginFormApiV1AuthLoginFormPost>>,
    { data: BodyLoginFormApiV1AuthLoginFormPost }
  > = (props) => {
    const { data } = props ?? {};

    return loginFormApiV1AuthLoginFormPost(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type LoginFormApiV1AuthLoginFormPostMutationResult = NonNullable<
  Awaited<ReturnType<typeof loginFormApiV1AuthLoginFormPost>>
>;
export type LoginFormApiV1AuthLoginFormPostMutationBody =
  BodyLoginFormApiV1AuthLoginFormPost;
export type LoginFormApiV1AuthLoginFormPostMutationError = HTTPValidationError;

/**
 * @summary Login Form
 */
export const useLoginFormApiV1AuthLoginFormPost = <
  TError = HTTPValidationError,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof loginFormApiV1AuthLoginFormPost>>,
    TError,
    { data: BodyLoginFormApiV1AuthLoginFormPost },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof loginFormApiV1AuthLoginFormPost>>,
  TError,
  { data: BodyLoginFormApiV1AuthLoginFormPost },
  TContext
> => {
  const mutationOptions =
    getLoginFormApiV1AuthLoginFormPostMutationOptions(options);

  return useMutation(mutationOptions);
};
/**
 * Endpoint para obtener información del usuario autenticado
Incluye datos de la tienda (Multi-Tenant)

Demuestra el uso de las dependencias Multi-Tenant
 * @summary Get Current User Info
 */
export const getCurrentUserInfoApiV1AuthMeGet = (
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal,
) => {
  return customInstance<GetCurrentUserInfoApiV1AuthMeGet200>(
    { url: `/api/v1/auth/me`, method: "GET", signal },
    options,
  );
};

export const getGetCurrentUserInfoApiV1AuthMeGetQueryKey = () => {
  return [`/api/v1/auth/me`] as const;
};

export const getGetCurrentUserInfoApiV1AuthMeGetQueryOptions = <
  TData = Awaited<ReturnType<typeof getCurrentUserInfoApiV1AuthMeGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof getCurrentUserInfoApiV1AuthMeGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey =
    queryOptions?.queryKey ?? getGetCurrentUserInfoApiV1AuthMeGetQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof getCurrentUserInfoApiV1AuthMeGet>>
  > = ({ signal }) => getCurrentUserInfoApiV1AuthMeGet(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getCurrentUserInfoApiV1AuthMeGet>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type GetCurrentUserInfoApiV1AuthMeGetQueryResult = NonNullable<
  Awaited<ReturnType<typeof getCurrentUserInfoApiV1AuthMeGet>>
>;
export type GetCurrentUserInfoApiV1AuthMeGetQueryError = unknown;

/**
 * @summary Get Current User Info
 */
export const useGetCurrentUserInfoApiV1AuthMeGet = <
  TData = Awaited<ReturnType<typeof getCurrentUserInfoApiV1AuthMeGet>>,
  TError = unknown,
>(options?: {
  query?: Partial<
    UseQueryOptions<
      Awaited<ReturnType<typeof getCurrentUserInfoApiV1AuthMeGet>>,
      TError,
      TData
    >
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getGetCurrentUserInfoApiV1AuthMeGetQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  query.queryKey = queryOptions.queryKey;

  return query;
};
