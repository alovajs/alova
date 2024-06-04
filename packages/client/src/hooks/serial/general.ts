import { createAssert } from '@alova/shared/assert';
import {
  falseValue,
  isArray,
  len,
  promiseResolve,
  promiseThen,
  pushItem,
  trueValue,
  undefinedValue
} from '@alova/shared/vars';
import { AlovaGenerics, Method } from 'alova';
import { AlovaFrontMiddleware, AlovaMethodHandler } from '~/typings';

/**
 * 断言serialHandlers
 * @param hookName hook name
 * @param serialHandlers 串行请求method获取函数
 */
export const assertSerialHandlers = (hookName: string, serialHandlers: any) =>
  createAssert(hookName)(
    isArray(serialHandlers) && len(serialHandlers) > 0,
    'please use an array to represent serial requests'
  );

export type SerialHandlers<AG extends AlovaGenerics> = [
  Method<AG> | AlovaMethodHandler<AG>,
  ...AlovaMethodHandler<AG>[]
];

/**
 * 创建串行请求中间件
 * @param serialHandlers 串行请求method获取函数
 * @param hookMiddleware use hook的中间件
 * @returns 串行请求中间件
 */
export const serialMiddleware = <AG extends AlovaGenerics>(
  serialHandlers: SerialHandlers<AG>,
  hookMiddleware?: AlovaFrontMiddleware<AG>
) => {
  // 第一个handler在外部传递给了use hook，不需要再次请求
  serialHandlers.shift();
  return ((ctx, next) => {
    hookMiddleware?.(ctx, () => promiseResolve(undefinedValue as any));

    ctx.controlLoading();
    const loadingState = ctx.proxyStates.loading;
    loadingState.v = trueValue;
    const methods: Method<AG>[] = [];
    let serialPromise = next();
    for (const handler of serialHandlers) {
      serialPromise = promiseThen(serialPromise, value => {
        const methodItem = (handler as AlovaMethodHandler<AG>)(value, ...ctx.args);
        pushItem(methods, methodItem);
        return methodItem.send();
      });
    }

    // 装饰错误回调函数，将event.method设置为出错的实例
    ctx.decorateError((handler, event) => {
      event.method = methods[len(methods) - 1];
      handler(event);
    });
    return serialPromise.finally(() => {
      loadingState.v = falseValue;
    });
  }) as AlovaFrontMiddleware<AG>;
};
