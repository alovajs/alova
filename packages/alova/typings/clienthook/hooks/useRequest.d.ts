import { AlovaGenerics, Method } from 'alova';
import { AlovaFrontMiddleware, AlovaMethodHandler, UseHookConfig, UseHookExposure } from '../general';

/** useRequest和useWatcher都有的类型 */
type InitialDataType = number | string | boolean | object;
export interface FrontRequestHookConfig<AG extends AlovaGenerics, Args extends any[]> extends UseHookConfig<AG, Args> {
  /** 是否立即发起一次请求 */
  immediate?: boolean;

  /** set initial data for request state */
  initialData?: InitialDataType | (() => InitialDataType);

  /** 额外的监管状态，可通过updateState更新 */
  managedStates?: Record<string | symbol, AG['StatesExport']['State']>;

  /** 中间件 */
  middleware?: AlovaFrontMiddleware<AG, Args>;
}

/** useRequest config export type */
export type RequestHookConfig<AG extends AlovaGenerics, Args extends any[]> = FrontRequestHookConfig<AG, Args>;

/**
 * 自动管理响应状态hook
 * @example
 * ```js
 * const { loading, data, error, send, onSuccess } = useRequest(alova.Get('/api/user'))
 * ```
 * @param methodHandler method实例或获取函数
 * @param config 配置项
 * @returns 响应式请求数据、操作函数及事件绑定函数
 */
export declare function useRequest<AG extends AlovaGenerics, Args extends any[]>(
  methodHandler: Method<AG> | AlovaMethodHandler<AG, Args>,
  config?: RequestHookConfig<AG, Args>
): UseHookExposure<AG, Args>;
