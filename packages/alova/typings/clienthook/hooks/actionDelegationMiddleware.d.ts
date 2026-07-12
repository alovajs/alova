import { AlovaGenerics } from 'alova';
import { AlovaFetcherMiddlewareContext, AlovaFrontMiddlewareContext, AlovaGuardNext } from '../general';

export interface Actions {
  [x: string]: (...args: any[]) => any;
}

/**
 * Operation function delegation middleware
 * After using this middleware, you can call the delegated function through accessAction.
 * Can delegate multiple identical IDs
 * In order to eliminate the hierarchical restrictions of components
 * @param id Client ID
 * @returns alova middleware function
 */
export declare function actionDelegationMiddleware<
  AG extends AlovaGenerics = AlovaGenerics,
  Args extends any[] = any[]
>(
  id: string | number | symbol
): (
  context: (AlovaFrontMiddlewareContext<AG, Args> | AlovaFetcherMiddlewareContext<AG, Args>) & {
    delegatingActions?: Actions;
  },
  next: AlovaGuardNext<AG, Args>
) => Promise<any>;

/**
 * Alias of `actionDelegationMiddleware` with a `use` prefix, recommended when the
 * React Compiler is enabled. React Compiler keeps `use`-prefixed calls in the
 * component render scope and never hoists them, which avoids
 * "Should have a queue" errors caused by the internal Hooks being invoked
 * outside of a component render.
 */
export declare const useActionDelegationMiddleware: typeof actionDelegationMiddleware;

/**
 * Access the operation function, if there are multiple matches, onMatch will be called with this
 * @param id Delegator id, or regular expression
 * @param onMatch matching subscribers
 */
export declare function accessAction(
  id: string | number | symbol | RegExp,
  onMatch: (matchedSubscriber: Record<string, any>, index: number) => void,
  silent?: boolean
): void;
