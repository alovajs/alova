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
 * Access the operation function, if there are multiple matches, onMatch will be called with this
 * @param id Delegator id, or regular expression
 * @param onMatch matching subscribers
 */
export declare function accessAction(
  id: string | number | symbol | RegExp,
  onMatch: (matchedSubscriber: Record<string, any>, index: number) => void
): void;
