import { AlovaGenerics, AlovaOptions, AlovaRequestAdapter, Method, StatesHook } from 'alova';
import adapterFetch from 'alova/fetch';

/**
 * 统一获取AlovaRequestAdapter的类型
 */
export type AlovaRequestAdapterUnified<
  RA extends
    | AlovaRequestAdapter<any, any, any>
    | ((...args: any[]) => AlovaRequestAdapter<any, any, any>) = AlovaRequestAdapter<any, any, any>
> = RA extends AlovaRequestAdapter<any, any, any> ? RA : ReturnType<RA>;

// transform types StateHook and AlovaRequestAdapter to an AlovaGenerics
export type StateHookAdapter2AG<SH extends StatesHook<any>, RA extends AlovaRequestAdapter<any, any, any>> =
  Parameters<RA>[1] extends Method<AlovaGenerics<infer R, infer T, infer RC, infer RE, infer RH>>
    ? AlovaGenerics<R, T, RC, RE, RH, any, any, SH extends StatesHook<infer SE> ? SE : 123123>
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
   * 忽略拦截的method
   */
  visitorMeta?: MetaMatches;
  /**
   * 登录请求拦截器
   */
  login?: ResponseAuthorizationInterceptor<RA>;

  /**
   * 登出请求拦截器
   */
  logout?: ResponseAuthorizationInterceptor<RA>;
  /**
   * 赋值token回调函数，登录标识和访客标识的请求不会触发此函数
   * @param method method实例
   */
  assignToken?: <AG extends AlovaGenerics>(method: Method<AG>) => void | Promise<void>;
}
export interface ClientTokenAuthenticationOptions<RA extends AlovaRequestAdapter<any, any, any>>
  extends TokenAuthenticationOptions<RA> {
  /**
   * 在请求前的拦截器中判断token是否过期，并刷新token
   */
  refreshToken?: {
    /**
     * 判断token是否过期
     */
    isExpired: RequestHandler<RA, boolean | Promise<boolean>>;
    /**
     * 刷新token
     */
    handler: RequestHandler<RA>;
    /**
     * 自定义匹配刷新token的method meta
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
   * 在请求成功拦截器中判断token是否过期，并刷新token
   */
  refreshTokenOnSuccess?: {
    /**
     * 判断token是否过期
     */
    isExpired: ResponseInterceptHandler<RA, boolean | Promise<boolean>>;
    /**
     * 刷新token
     */
    handler: ResponseInterceptHandler<RA>;
    /**
     * 自定义匹配刷新token的method meta
     */
    metaMatches?: MetaMatches;
  };

  /**
   * 在请求失败拦截器中判断token是否过期，并刷新token
   */
  refreshTokenOnError?: {
    /**
     * 判断token是否过期
     */
    isExpired: ResponseErrorInterceptHandler<RA, boolean | Promise<boolean>>;
    /**
     * 刷新token
     */
    handler: ResponseErrorInterceptHandler<RA>;
    /**
     * 自定义匹配刷新token的method meta
     */
    metaMatches?: MetaMatches;
  };
}

/**
 * 创建客户端的token认证拦截器
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
 * @param options 配置参数
 * @returns token认证拦截器函数
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
 * 创建服务端的token认证拦截器
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
 * @param options 配置参数
 * @returns token认证拦截器函数
 */
export declare function createServerTokenAuthentication<
  SH extends StatesHook<any>,
  RA extends
    | AlovaRequestAdapter<any, any, any>
    | ((...args: any[]) => AlovaRequestAdapter<any, any, any>) = typeof adapterFetch
>(
  options: ServerTokenAuthenticationOptions<AlovaRequestAdapterUnified<RA>>
): TokenAuthenticationResult<SH, AlovaRequestAdapterUnified<RA>>;
