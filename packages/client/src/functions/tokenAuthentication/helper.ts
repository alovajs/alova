import {
  PromiseCls,
  falseValue,
  forEach,
  instanceOf,
  isFn,
  isPlainObject,
  len,
  newInstance,
  noop,
  pushItem,
  splice,
  trueValue,
  undefinedValue
} from '@alova/shared';
import {
  AlovaRequestAdapter,
  Method,
  RespondedHandler,
  ResponseCompleteHandler,
  ResponseErrorHandler,
  StatesHook
} from 'alova';
import {
  AlovaResponded,
  MetaMatches,
  ResponseAuthorizationInterceptor,
  StateHookAdapter2AG
} from '~/typings/clienthook';

export type PosibbleAuthMap =
  | {
      metaMatches?: MetaMatches;
      handler: any;
    }
  | undefined;
export type WaitingRequestList = {
  method: Method;
  resolve: () => void;
}[];

export const defaultVisitorMeta = {
  authRole: null
};
export const defaultLoginMeta = {
  authRole: 'login'
};
export const defaultLogoutMeta = {
  authRole: 'logout'
};
export const defaultRefreshTokenMeta = {
  authRole: 'refreshToken'
};
export const checkMethodRole = ({ meta }: Method, metaMatches: MetaMatches) => {
  if (isPlainObject(meta)) {
    for (const key in meta) {
      if (Object.prototype.hasOwnProperty.call(meta, key)) {
        const matchedMetaItem = metaMatches[key];
        if (instanceOf(matchedMetaItem, RegExp) ? matchedMetaItem.test(meta[key]) : meta[key] === matchedMetaItem) {
          return trueValue;
        }
      }
    }
  }
  return falseValue;
};
export const waitForTokenRefreshed = (method: Method, waitingList: WaitingRequestList) =>
  newInstance(PromiseCls, resolve => {
    pushItem(waitingList, {
      method,
      resolve
    });
  });
export const callHandlerIfMatchesMeta = (
  method: Method,
  authorizationInterceptor: ResponseAuthorizationInterceptor<AlovaRequestAdapter<any, any, any>> | undefined,
  defaultMeta: MetaMatches,
  response: any
) => {
  if (checkMethodRole(method, (authorizationInterceptor as PosibbleAuthMap)?.metaMatches || defaultMeta)) {
    const handler = isFn(authorizationInterceptor)
      ? authorizationInterceptor
      : isPlainObject(authorizationInterceptor) && isFn(authorizationInterceptor.handler)
        ? authorizationInterceptor.handler
        : noop;
    return handler(response, method);
  }
};
export const refreshTokenIfExpired = async (
  method: Method,
  waitingList: WaitingRequestList,
  updateRefreshStatus: (status: boolean) => void,
  handlerParams: any[],
  refreshToken?: {
    isExpired: (...args: any[]) => boolean | Promise<boolean>;
    handler: (...args: any[]) => Promise<void>;
  },
  tokenRefreshing?: boolean
) => {
  // When the number of handle params is greater than 2, it means that this function is called from the response, and the original interface needs to be requested again.
  const fromResponse = len(handlerParams) >= 2;
  let isExpired = refreshToken?.isExpired(...handlerParams);
  // Compatible with synchronous and asynchronous functions
  if (instanceOf(isExpired, PromiseCls)) {
    isExpired = await isExpired;
  }

  if (isExpired) {
    try {
      // Make another judgment in the response to prevent multiple requests to refresh the token, intercept and wait for the token sent before the token refresh is completed.
      let intentToRefreshToken = trueValue;
      if (fromResponse && tokenRefreshing) {
        intentToRefreshToken = falseValue; // The requests waiting here indicate that the token is being refreshed. When they pass, there is no need to refresh the token again.
        await waitForTokenRefreshed(method, waitingList);
      }

      if (intentToRefreshToken) {
        updateRefreshStatus(trueValue);
        // Call refresh token
        await refreshToken?.handler(...handlerParams);
        updateRefreshStatus(falseValue);
        // After the token refresh is completed, the requests in the waiting list are notified.
        forEach(waitingList, ({ resolve }) => resolve());
      }
      if (fromResponse) {
        // Because the original interface is being requested again, superposition with the previous request will result in repeated calls to transform, so it is necessary to leave transform empty to remove one call.
        const { config } = method;
        const methodTransformData = config.transform;
        config.transform = undefinedValue;
        const resentData = await method;
        config.transform = methodTransformData;
        return resentData;
      }
    } finally {
      updateRefreshStatus(falseValue);
      splice(waitingList, 0, len(waitingList)); // Clear waiting list
    }
  }
};

export const onResponded2Record = <SH extends StatesHook<any>, RA extends AlovaRequestAdapter<any, any, any>>(
  onRespondedHandlers?: AlovaResponded<SH, RA>
) => {
  type AG = StateHookAdapter2AG<SH, RA>;
  let successHandler: RespondedHandler<AG> | undefined = undefinedValue;
  let errorHandler: ResponseErrorHandler<AG> | undefined = undefinedValue;
  let onCompleteHandler: ResponseCompleteHandler<AG> | undefined = undefinedValue;
  if (isFn(onRespondedHandlers)) {
    successHandler = onRespondedHandlers;
  } else if (isPlainObject(onRespondedHandlers)) {
    const { onSuccess, onError, onComplete } = onRespondedHandlers;
    successHandler = isFn(onSuccess) ? onSuccess : successHandler;
    errorHandler = isFn(onError) ? onError : errorHandler;
    onCompleteHandler = isFn(onComplete) ? onComplete : onCompleteHandler;
  }
  return {
    onSuccess: successHandler,
    onError: errorHandler,
    onComplete: onCompleteHandler
  };
};
