import {
  createAssert,
  falseValue,
  isArray,
  len,
  promiseResolve,
  promiseThen,
  pushItem,
  trueValue,
  undefinedValue
} from '@alova/shared';
import { AlovaGenerics, Method } from 'alova';
import { AlovaFrontMiddleware, AlovaMethodHandler } from '~/typings/clienthook';

/**
 * Assert serialHandlers
 * @param hookName hook name
 * @param serialHandlers Serial request method acquisition function
 */
export const assertSerialHandlers = (hookName: string, serialHandlers: any) =>
  createAssert(hookName)(
    isArray(serialHandlers) && len(serialHandlers) > 0,
    'please use an array to represent serial requests'
  );

export type SerialHandlers<AG extends AlovaGenerics, Args extends any[] = any[]> = [
  Method<AG> | AlovaMethodHandler<AG, Args>,
  ...AlovaMethodHandler<AG>[]
];

/**
 * Create serial request middleware
 * @param serialHandlers Serial request method acquisition function
 * @param hookMiddleware use hook middleware
 * @returns Serial request middleware
 */
export const serialMiddleware = <AG extends AlovaGenerics, Args extends any[] = any[]>(
  serialHandlers: SerialHandlers<AG, Args>,
  hookMiddleware?: AlovaFrontMiddleware<AG, Args>,
  serialRequestMethods: Method<AG>[] = []
) => {
  // The first handler is passed to the use hook externally and does not need to be requested again.
  serialHandlers.shift();
  return ((ctx, next) => {
    hookMiddleware?.(ctx, () => promiseResolve(undefinedValue as any));

    ctx.controlLoading();
    const loadingState = ctx.proxyStates.loading;
    loadingState.v = trueValue;
    let serialPromise = next();
    for (const handler of serialHandlers) {
      serialPromise = promiseThen(serialPromise, value => {
        const methodItem = (handler as AlovaMethodHandler<AG>)(value, ...ctx.args);
        pushItem(serialRequestMethods, methodItem);
        return methodItem.send();
      });
    }

    return serialPromise.finally(() => {
      loadingState.v = falseValue;
    });
  }) as AlovaFrontMiddleware<AG, Args>;
};
