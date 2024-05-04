import { AlovaFrontMiddleware, AlovaMethodHandler, Method } from 'alova';
import { createAssert, isArray, len, promiseResolve, promiseThen, pushItem, shift } from '@/helper';
import { falseValue, trueValue, undefinedValue } from '@/helper/variables';

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

export type SerialHandlers<S, E, R, T, RC, RE, RH> = [
  Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
  ...AlovaMethodHandler<S, E, R, T, RC, RE, RH>[]
];

/**
 * 创建串行请求中间件
 * @param serialHandlers 串行请求method获取函数
 * @param hookMiddleware use hook的中间件
 * @returns 串行请求中间件
 */
export const serialMiddleware = <S, E, R, T, RC, RE, RH>(
  serialHandlers: SerialHandlers<S, E, R, T, RC, RE, RH>,
  hookMiddleware?: AlovaFrontMiddleware<S, E, R, T, RC, RE, RH>
) => {
  // 第一个handler在外部传递给了use hook，不需要再次请求
  shift(serialHandlers);
  return ((ctx, next) => {
    hookMiddleware?.(ctx, () => promiseResolve(undefinedValue as any));

    ctx.controlLoading();
    ctx.update({ loading: trueValue });
    const methods: Method[] = [];
    let serialPromise = next();
    for (const i in serialHandlers) {
      serialPromise = promiseThen(serialPromise, value => {
        const methodItem = (serialHandlers as AlovaMethodHandler<S, E, R, T, RC, RE, RH>[])[i](value, ...ctx.sendArgs);
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
      ctx.update({ loading: falseValue });
    });
  }) as AlovaFrontMiddleware<S, E, R, T, RC, RE, RH>;
};
