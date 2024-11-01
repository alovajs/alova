import { AlovaGenerics, AlovaOptions, AlovaRequestAdapter, Method, StatesHook } from 'alova';
import adapterFetch from 'alova/fetch';

/**
 * Unifiedly obtain the type of AlovaRequestAdapter
 */
export type AlovaRequestAdapterUnified<
  RA extends
    | AlovaRequestAdapter<any, any, any>
    | ((...args: any[]) => AlovaRequestAdapter<any, any, any>) = AlovaRequestAdapter<any, any, any>
> = RA extends AlovaRequestAdapter<any, any, any> ? RA : ReturnType<RA>;

// transform types StateHook and AlovaRequestAdapter to an AlovaGenerics
export type StateHookAdapter2AG<SH extends StatesHook<any>, RA extends AlovaRequestAdapter<any, any, any>> =
  Parameters<RA>[1] extends Method<AlovaGenerics<infer R, infer T, infer RC, infer RE, infer RH>>
    ? AlovaGenerics<R, T, RC, RE, RH, any, any, SH extends StatesHook<infer SE> ? SE : unknown>
    : never;

export type AlovaResponded<SH extends StatesHook<any>, RA extends AlovaRequestAdapter<any, any, any>> = NonNullable<
  AlovaOptions<StateHookAdapter2AG<SH, RA>>['responded']
>;

export type MetaMatches = Record<string, any>;
export type ResponseInterceptHandler<RA extends AlovaRequestAdapter<any, any, any>, RESULT = Promise<void>> = (
  response: ReturnType<ReturnType<RA>['response']> extends Promise<infer RE> ? RE : never,
  method: Parameters<RA>[1]
) => RESULT;
export type ResponseErrorInterceptHandler<RA extends AlovaRequestAdapter<any, any, any>, RESULT = Promise<void>> = (
  error: any,
  method: Parameters<RA>[1]
) => RESULT;
export type ResponseAuthorizationInterceptor<RA extends AlovaRequestAdapter<any, any, any>> =
  | ResponseInterceptHandler<RA, void | Promise<void>>
  | {
      metaMatches?: MetaMatches;
      handler: ResponseInterceptHandler<RA, void | Promise<void>>;
    };

export type RequestHandler<RA extends AlovaRequestAdapter<any, any, any>, RESULT = Promise<void>> = (
  method: Parameters<RA>[1]
) => RESULT;

export interface TokenAuthenticationOptions<RA extends AlovaRequestAdapter<any, any, any>> {
  /**
   * Ignore intercepted methods
   */
  visitorMeta?: MetaMatches;
  /**
   * Login request interceptor
   */
  login?: ResponseAuthorizationInterceptor<RA>;

  /**
   * Logout request interceptor
   */
  logout?: ResponseAuthorizationInterceptor<RA>;
  /**
   * Assign token callback function, requests for login ID and visitor ID will not trigger this function
   * @param method method instance
   */
  assignToken?: <AG extends AlovaGenerics>(method: Method<AG>) => void | Promise<void>;
}
export interface ClientTokenAuthenticationOptions<RA extends AlovaRequestAdapter<any, any, any>>
  extends TokenAuthenticationOptions<RA> {
  /**
   * Determine whether the token has expired in the interceptor before the request, and refresh the token
   */
  refreshToken?: {
    /**
     * Determine whether the token has expired
     */
    isExpired: RequestHandler<RA, boolean | Promise<boolean>>;
    /**
     * Refresh token
     */
    handler: RequestHandler<RA>;
    /**
     * Customize the method meta that matches the refresh token
     */
    metaMatches?: MetaMatches;
  };
}

export type AlovaBeforeRequest<SH extends StatesHook<any>, RA extends AlovaRequestAdapter<any, any, any>> = (
  method: Method<StateHookAdapter2AG<SH, RA>>
) => void | Promise<void>;

type BeforeRequestType<SH extends StatesHook<any>, RA extends AlovaRequestAdapter<any, any, any>> = (
  originalBeforeRequest?: AlovaBeforeRequest<SH, RA>
) => AlovaBeforeRequest<SH, RA>;
type ResponseType<SH extends StatesHook<any>, RA extends AlovaRequestAdapter<any, any, any>> = (
  originalResponded?: AlovaResponded<SH, RA>
) => AlovaResponded<SH, RA>;

export interface TokenAuthenticationResult<SH extends StatesHook<any>, RA extends AlovaRequestAdapter<any, any, any>> {
  onAuthRequired: BeforeRequestType<SH, RA>;
  onResponseRefreshToken: ResponseType<SH, RA>;
  waitingList: {
    method: Method<StateHookAdapter2AG<SH, RA>>;
    resolve: () => void;
  }[];
}

export interface ServerTokenAuthenticationOptions<RA extends AlovaRequestAdapter<any, any, any>>
  extends TokenAuthenticationOptions<RA> {
  /**
   * Determine whether the token has expired in the request success interceptor and refresh the token
   */
  refreshTokenOnSuccess?: {
    /**
     * Determine whether the token has expired
     */
    isExpired: ResponseInterceptHandler<RA, boolean | Promise<boolean>>;
    /**
     * Refresh token
     */
    handler: ResponseInterceptHandler<RA>;
    /**
     * Customize the method meta that matches the refresh token
     */
    metaMatches?: MetaMatches;
  };

  /**
   * Determine whether the token has expired in the request failure interceptor and refresh the token
   */
  refreshTokenOnError?: {
    /**
     * Determine whether the token has expired
     */
    isExpired: ResponseErrorInterceptHandler<RA, boolean | Promise<boolean>>;
    /**
     * Refresh token
     */
    handler: ResponseErrorInterceptHandler<RA>;
    /**
     * Customize the method meta that matches the refresh token
     */
    metaMatches?: MetaMatches;
  };
}

/**
 * Create a client-side token authentication interceptor
 * @example
 * ```js
 * const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication(\/* ... *\/);
 * const alova = createAlova({
 *   // ...
 *   beforeRequest: onAuthRequired(method => {
 *     // ...
 *   }),
 *   responded: onResponseRefreshToken({
 *     onSuccess(response, method) {
 *       // ...
 *     },
 *     onError(error, method) {
 *       // ...
 *     },
 *   })
 * });
 * ```
 * @param options Configuration parameters
 * @returns token authentication interceptor function
 */
export declare function createClientTokenAuthentication<
  SH extends StatesHook<any>,
  RA extends
    | AlovaRequestAdapter<any, any, any>
    | ((...args: any[]) => AlovaRequestAdapter<any, any, any>) = typeof adapterFetch
>(
  options: ClientTokenAuthenticationOptions<AlovaRequestAdapterUnified<RA>>
): TokenAuthenticationResult<SH, AlovaRequestAdapterUnified<RA>>;

/**
 * Create a server-side token authentication interceptor
 * @example
 * ```js
 * const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication(\/* ... *\/);
 * const alova = createAlova({
 *   // ...
 *   beforeRequest: onAuthRequired(method => {
 *     // ...
 *   }),
 *   responded: onResponseRefreshToken({
 *     onSuccess(response, method) {
 *       // ...
 *     },
 *     onError(error, method) {
 *       // ...
 *     },
 *   })
 * });
 * ```
 * @param options Configuration parameters
 * @returns token authentication interceptor function
 */
export declare function createServerTokenAuthentication<
  SH extends StatesHook<any>,
  RA extends
    | AlovaRequestAdapter<any, any, any>
    | ((...args: any[]) => AlovaRequestAdapter<any, any, any>) = typeof adapterFetch
>(
  options: ServerTokenAuthenticationOptions<AlovaRequestAdapterUnified<RA>>
): TokenAuthenticationResult<SH, AlovaRequestAdapterUnified<RA>>;
