import { AlovaGenerics, Method } from 'alova';

/**
 * server hook model, it represents the type of all server hooks.
 * pass a method or hooked method instance, set the options, and return a hooked method instance.
 * you can continue decorate this method, and reach the effect of multiple server hooks combination.
 */
export interface AlovaServerHook<Options extends Record<string, any>> {
  <AG extends AlovaGenerics>(method: Method<AG>, options: Options): Method<AG>;
}

export interface RetryOptions {
  /**
   * The maximum number of retries. it can also be set as a function that returns a boolean to dynamically determine whether to continue retry.
   * @default 3
   */
  retry?: number | ((error: Error) => boolean);

  /**
   * backoff policy
   */
  backoff?: BackoffPolicy;
}

/**
 * retry hook
 */
export declare const retry: AlovaServerHook<RetryOptions>;
