import { $self, noop } from '@alova/shared/function';
import { falseValue } from '@alova/shared/vars';
import { AlovaGenerics, AlovaRequestAdapter, RespondedHandlerRecord, StatesHook } from 'alova';
import {
  ClientTokenAuthenticationOptions,
  ServerTokenAuthenticationOptions,
  TokenAuthenticationResult
} from '~/typings/general';
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
 * 创建客户端的token认证拦截器
 * @param options 配置参数
 * @returns token认证拦截器函数
 */
export const createClientTokenAuthentication = ({
  visitorMeta,
  login,
  logout,
  refreshToken,
  assignToken = noop
}: ClientTokenAuthenticationOptions<AlovaRequestAdapter<any, any, any>>) => {
  let tokenRefreshing = falseValue;
  const waitingList: WaitingRequestList = [];
  return {
    waitingList,
    onAuthRequired: onBeforeRequest => async method => {
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
    },
    onResponseRefreshToken: onRespondedHandlers => {
      const respondedRecord = onResponded2Record(onRespondedHandlers);
      return {
        ...respondedRecord,
        onSuccess: async (response, method) => {
          await callHandlerIfMatchesMeta(method, login, defaultLoginMeta, response);
          await callHandlerIfMatchesMeta(method, logout, defaultLogoutMeta, response);
          return (respondedRecord.onSuccess || $self)(response, method);
        }
      } as RespondedHandlerRecord<AlovaGenerics>;
    }
  } as TokenAuthenticationResult<StatesHook<any, any>, AlovaRequestAdapter<any, any, any>>;
};

/**
 * 创建服务端的token认证拦截器
 * @param options 配置参数
 * @returns token认证拦截器函数
 */
export const createServerTokenAuthentication = ({
  visitorMeta,
  login,
  logout,
  refreshTokenOnSuccess,
  refreshTokenOnError,
  assignToken = noop
}: ServerTokenAuthenticationOptions<AlovaRequestAdapter<any, any, any>>) => {
  let tokenRefreshing = falseValue;
  const waitingList: WaitingRequestList = [];
  return {
    waitingList,
    onAuthRequired: onBeforeRequest => async method => {
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
    },
    onResponseRefreshToken: onRespondedHandlers => {
      const respondedRecord = onResponded2Record(onRespondedHandlers);
      return {
        ...respondedRecord,
        onSuccess: async (response, method) => {
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
        onError: async (error, method) => {
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
      } as RespondedHandlerRecord<AlovaGenerics>;
    }
  } as TokenAuthenticationResult<StatesHook<any, any>, AlovaRequestAdapter<any, any, any>>;
};
