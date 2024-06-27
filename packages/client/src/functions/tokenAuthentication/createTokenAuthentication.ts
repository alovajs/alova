import { $self, noop } from '@alova/shared/function';
import { falseValue } from '@alova/shared/vars';
import { AlovaGenerics, AlovaOptions, AlovaRequestAdapter, Method, StatesExport, StatesHook } from 'alova';
import { GlobalFetchRequestAdapter } from 'alova/fetch';
import {
  AlovaResponded,
  ClientTokenAuthenticationOptions,
  ServerTokenAuthenticationOptions
} from '~/typings/clienthook';
import {
  PosibbleAuthMap,
  WaitingRequestList,
  callHandlerIfMatchesMeta,
  checkMethodRole,
  defaultLoginMeta,
  defaultLogoutMeta,
  defaultRefreshTokenMeta,
  defaultVisitorMeta,
  onResponded2Record,
  refreshTokenIfExpired,
  waitForTokenRefreshed
} from './helper';

/**
 * 统一获取AlovaRequestAdapter的类型
 */
type AlovaRequestAdapterUnified<
  RA extends
    | AlovaRequestAdapter<any, any, any>
    | ((...args: any[]) => AlovaRequestAdapter<any, any, any>) = AlovaRequestAdapter<any, any, any>
> = RA extends AlovaRequestAdapter<any, any, any> ? RA : ReturnType<RA>;

type BeforeRequestType<AG extends AlovaGenerics> = (
  originalBeforeRequest?: AlovaOptions<AG>['beforeRequest']
) => AlovaOptions<AG>['beforeRequest'];
type ResponseType<SH extends StatesHook<StatesExport<any>>, RA extends AlovaRequestAdapter<any, any, any>> = (
  originalResponded?: AlovaResponded<SH, RA>
) => AlovaResponded<SH, RA>;

/**
 * 创建客户端的token认证拦截器
 * @param options 配置参数
 * @returns token认证拦截器函数
 */
export const createClientTokenAuthentication = <
  SH extends StatesHook<any>,
  RA extends
    | AlovaRequestAdapter<any, any, any>
    | ((...args: any[]) => AlovaRequestAdapter<any, any, any>) = GlobalFetchRequestAdapter
>({
  visitorMeta,
  login,
  logout,
  refreshToken,
  assignToken = noop
}: ClientTokenAuthenticationOptions<AlovaRequestAdapterUnified<RA>>) => {
  let tokenRefreshing = falseValue;
  const waitingList: WaitingRequestList = [];
  const onAuthRequired: BeforeRequestType<AlovaGenerics> =
    <AG extends AlovaGenerics>(onBeforeRequest: AlovaOptions<AG>['beforeRequest']) =>
    async (method: Method<AG>) => {
      const isVisitorRole = checkMethodRole(method, visitorMeta || defaultVisitorMeta);
      const isLoginRole = checkMethodRole(method, (login as PosibbleAuthMap)?.metaMatches || defaultLoginMeta);
      // 被忽略的、登录、刷新token的请求不进行token认证
      if (
        !isVisitorRole &&
        !isLoginRole &&
        !checkMethodRole(method, (refreshToken as PosibbleAuthMap)?.metaMatches || defaultRefreshTokenMeta)
      ) {
        // 如果正在刷新token，则等待刷新完成后再发请求
        if (tokenRefreshing) {
          await waitForTokenRefreshed(method, waitingList);
        }
        await refreshTokenIfExpired(
          method,
          waitingList,
          refreshing => {
            tokenRefreshing = refreshing;
          },
          [method],
          refreshToken
        );
      }

      // 非访客和登录角色的请求会进入赋值token函数
      if (!isVisitorRole && !isLoginRole) {
        await assignToken(method);
      }
      onBeforeRequest?.(method);
    };

  const onResponseRefreshToken: ResponseType<SH, AlovaRequestAdapterUnified<RA>> = originalResponded => {
    const respondedRecord = onResponded2Record<SH, AlovaRequestAdapterUnified<RA>>(originalResponded);
    return {
      ...respondedRecord,
      onSuccess: async (response: any, method: Method) => {
        await callHandlerIfMatchesMeta(method, login, defaultLoginMeta, response);
        await callHandlerIfMatchesMeta(method, logout, defaultLogoutMeta, response);
        return (respondedRecord.onSuccess || $self)(response, method);
      }
    };
  };
  return {
    waitingList,
    onAuthRequired,
    onResponseRefreshToken
  };
};

/**
 * 创建服务端的token认证拦截器
 * @param options 配置参数
 * @returns token认证拦截器函数
 */
export const createServerTokenAuthentication = <
  SH extends StatesHook<any>,
  RA extends
    | AlovaRequestAdapter<any, any, any>
    | ((...args: any[]) => AlovaRequestAdapter<any, any, any>) = GlobalFetchRequestAdapter
>({
  visitorMeta,
  login,
  logout,
  refreshTokenOnSuccess,
  refreshTokenOnError,
  assignToken = noop
}: ServerTokenAuthenticationOptions<AlovaRequestAdapterUnified<RA>>) => {
  let tokenRefreshing = falseValue;
  const waitingList: WaitingRequestList = [];

  const onAuthRequired: BeforeRequestType<AlovaGenerics> = onBeforeRequest => async method => {
    const isVisitorRole = checkMethodRole(method, visitorMeta || defaultVisitorMeta);
    const isLoginRole = checkMethodRole(method, (login as PosibbleAuthMap)?.metaMatches || defaultLoginMeta);
    // 被忽略的、登录、刷新token的请求不进行token认证
    if (
      !isVisitorRole &&
      !isLoginRole &&
      !checkMethodRole(method, (refreshTokenOnSuccess as PosibbleAuthMap)?.metaMatches || defaultRefreshTokenMeta) &&
      !checkMethodRole(method, (refreshTokenOnError as PosibbleAuthMap)?.metaMatches || defaultRefreshTokenMeta)
    ) {
      // 如果正在刷新token，则等待刷新完成后再发请求
      if (tokenRefreshing) {
        await waitForTokenRefreshed(method, waitingList);
      }
    }
    if (!isVisitorRole && !isLoginRole) {
      await assignToken(method);
    }
    onBeforeRequest?.(method);
  };

  const onResponseRefreshToken: ResponseType<SH, AlovaRequestAdapterUnified<RA>> = onRespondedHandlers => {
    const respondedRecord = onResponded2Record<SH, AlovaRequestAdapterUnified<RA>>(onRespondedHandlers);
    return {
      ...respondedRecord,
      onSuccess: async (response: any, method: Method) => {
        if (
          !checkMethodRole(method, visitorMeta || defaultVisitorMeta) &&
          !checkMethodRole(method, (login as PosibbleAuthMap)?.metaMatches || defaultLoginMeta) &&
          !checkMethodRole(method, (refreshTokenOnSuccess as PosibbleAuthMap)?.metaMatches || defaultRefreshTokenMeta)
        ) {
          const dataResent = await refreshTokenIfExpired(
            method,
            waitingList,
            refreshing => {
              tokenRefreshing = refreshing;
            },
            [response, method],
            refreshTokenOnSuccess,
            tokenRefreshing
          );
          if (dataResent) {
            return dataResent;
          }
        }

        await callHandlerIfMatchesMeta(method, login, defaultLoginMeta, response);
        await callHandlerIfMatchesMeta(method, logout, defaultLogoutMeta, response);
        return (respondedRecord.onSuccess || $self)(response, method);
      },
      onError: async (error: any, method: Method) => {
        if (
          !checkMethodRole(method, visitorMeta || defaultVisitorMeta) &&
          !checkMethodRole(method, (login as PosibbleAuthMap)?.metaMatches || defaultLoginMeta) &&
          !checkMethodRole(method, (refreshTokenOnError as PosibbleAuthMap)?.metaMatches || defaultRefreshTokenMeta)
        ) {
          const dataResent = await refreshTokenIfExpired(
            method,
            waitingList,
            refreshing => {
              tokenRefreshing = refreshing;
            },
            [error, method],
            refreshTokenOnError,
            tokenRefreshing
          );
          if (dataResent) {
            return dataResent;
          }
        }
        return (respondedRecord.onError || noop)(error, method);
      }
    };
  };

  return {
    waitingList,
    onAuthRequired,
    onResponseRefreshToken
  };
};
