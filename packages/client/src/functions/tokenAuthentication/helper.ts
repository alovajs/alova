import { instanceOf, isFn, isPlainObject, newInstance, noop } from '@alova/shared/function';
import { PromiseCls, falseValue, forEach, len, pushItem, splice, trueValue, undefinedValue } from '@alova/shared/vars';
import {
  AlovaRequestAdapter,
  Method,
  RespondedHandler,
  ResponseCompleteHandler,
  ResponseErrorHandler,
  StatesHook
} from 'alova';
import { AlovaResponded, MetaMatches, ResponseAuthorizationInterceptor } from '~/typings/general';

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
      if (meta.hasOwn(key)) {
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
  // 当handleParams数量大于2时，说明是从响应中调用此函数的，此时需要重新请求原接口
  const fromResponse = len(handlerParams) >= 2;
  let isExpired = refreshToken?.isExpired(...handlerParams);
  // 兼容处理同步函数和异步函数
  if (instanceOf(isExpired, PromiseCls)) {
    isExpired = await isExpired;
  }

  if (isExpired) {
    try {
      // 在响应中再次判断，防止请求多次刷新token，把在token刷新完成前发送的拦截并等待
      let intentToRefreshToken = trueValue;
      if (fromResponse && tokenRefreshing) {
        intentToRefreshToken = falseValue; // 在此等待的请求表示token刷新中，当它们通过后不再需要再次刷新token了
        await waitForTokenRefreshed(method, waitingList);
      }

      if (intentToRefreshToken) {
        updateRefreshStatus(trueValue);
        // 调用刷新token
        await refreshToken?.handler(...handlerParams);
        updateRefreshStatus(falseValue);
        // 刷新token完成后，通知等待列表中的请求
        forEach(waitingList, ({ resolve }) => resolve());
      }
      if (fromResponse) {
        // 这里因为是重新请求原接口，与上一次请求叠加会导致重复调用transformData，因此需要将transformData置空去除一次调用
        const { config } = method;
        const methodTransformData = config.transformData;
        config.transformData = undefinedValue;
        const resentData = await method;
        config.transformData = methodTransformData;
        return resentData;
      }
    } finally {
      updateRefreshStatus(falseValue);
      splice(waitingList, 0, len(waitingList)); // 清空waitingList
    }
  }
};
export const onResponded2Record = (
  onRespondedHandlers?: AlovaResponded<StatesHook<any, any>, AlovaRequestAdapter<any, any, any>>
) => {
  let successHandler: RespondedHandler<any, any, any, any, any, any> | undefined = undefinedValue;
  let errorHandler: ResponseErrorHandler<any, any, any, any, any, any> | undefined = undefinedValue;
  let onCompleteHandler: ResponseCompleteHandler<any, any, any, any, any, any> | undefined = undefinedValue;
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
