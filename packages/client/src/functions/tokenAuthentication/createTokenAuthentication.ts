import { $self, falseValue, noop } from '@alova/shared';
import { AlovaRequestAdapter, Method, StatesHook } from 'alova';
import { FetchRequestAdapter } from 'alova/fetch';
import {
  AlovaRequestAdapterUnified,
  BeforeRequestType,
  ClientTokenAuthenticationOptions,
  ResponseType,
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
 * Create a client-side token authentication interceptor
 * @param options Configuration parameters
 * @returns token authentication interceptor function
 */
export const createClientTokenAuthentication = <
  SH extends StatesHook<any>,
  RA extends
    | AlovaRequestAdapter<any, any, any>
    | ((...args: any[]) => AlovaRequestAdapter<any, any, any>) = FetchRequestAdapter
>({
  visitorMeta,
  login,
  logout,
  refreshToken,
  assignToken = noop
}: ClientTokenAuthenticationOptions<AlovaRequestAdapterUnified<RA>>) => {
  let tokenRefreshing = falseValue;
  const waitingList: WaitingRequestList = [];
  const onAuthRequired: BeforeRequestType<SH, AlovaRequestAdapterUnified<RA>> = onBeforeRequest => async method => {
    const isVisitorRole = checkMethodRole(method, visitorMeta || defaultVisitorMeta);
    const isLoginRole = checkMethodRole(method, (login as PosibbleAuthMap)?.metaMatches || defaultLoginMeta);
    // Ignored, login, and token refresh requests do not perform token authentication.
    if (
      !isVisitorRole &&
      !isLoginRole &&
      !checkMethodRole(method, (refreshToken as PosibbleAuthMap)?.metaMatches || defaultRefreshTokenMeta)
    ) {
      // If the token is being refreshed, wait for the refresh to complete before sending a request.
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

    // Requests from non-guest and logged-in roles will enter the assignment token function
    if (!isVisitorRole && !isLoginRole) {
      await assignToken(method);
    }
    return onBeforeRequest?.(method);
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
 * Create a server-side token authentication interceptor
 * @param options Configuration parameters
 * @returns token authentication interceptor function
 */
export const createServerTokenAuthentication = <
  SH extends StatesHook<any>,
  RA extends
    | AlovaRequestAdapter<any, any, any>
    | ((...args: any[]) => AlovaRequestAdapter<any, any, any>) = FetchRequestAdapter
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

  const onAuthRequired: BeforeRequestType<SH, AlovaRequestAdapterUnified<RA>> = onBeforeRequest => async method => {
    const isVisitorRole = checkMethodRole(method, visitorMeta || defaultVisitorMeta);
    const isLoginRole = checkMethodRole(method, (login as PosibbleAuthMap)?.metaMatches || defaultLoginMeta);
    // Ignored, login, and token refresh requests do not perform token authentication.
    if (
      !isVisitorRole &&
      !isLoginRole &&
      !checkMethodRole(method, (refreshTokenOnSuccess as PosibbleAuthMap)?.metaMatches || defaultRefreshTokenMeta) &&
      !checkMethodRole(method, (refreshTokenOnError as PosibbleAuthMap)?.metaMatches || defaultRefreshTokenMeta)
    ) {
      // If the token is being refreshed, wait for the refresh to complete before sending a request.
      if (tokenRefreshing) {
        await waitForTokenRefreshed(method, waitingList);
      }
    }
    if (!isVisitorRole && !isLoginRole) {
      await assignToken(method);
    }
    return onBeforeRequest?.(method);
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
