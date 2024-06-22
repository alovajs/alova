import { AlovaGenerics, Method } from 'alova';
import { AlovaEvent, AlovaMethodHandler, ExportedState } from '../general';

export const enum SSEHookReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSED = 2
}

export interface AlovaSSEEvent<AG extends AlovaGenerics> extends AlovaEvent<AG> {
  method: Method;
  eventSource: EventSource; // eventSource实例
}
export interface AlovaSSEErrorEvent<AG extends AlovaGenerics> extends AlovaSSEEvent<AG> {
  error: Error; // 错误对象
}
export interface AlovaSSEMessageEvent<Data, AG extends AlovaGenerics> extends AlovaSSEEvent<AG> {
  data: Data; // 每次响应的，经过拦截器转换后的数据
}
export type SSEOnOpenTrigger<AG extends AlovaGenerics> = (event: AlovaSSEEvent<AG>) => void;
export type SSEOnMessageTrigger<Data, AG extends AlovaGenerics> = (event: AlovaSSEMessageEvent<Data, AG>) => void;
export type SSEOnErrorTrigger<AG extends AlovaGenerics> = (event: AlovaSSEErrorEvent<AG>) => void;
export type SSEOn<AG extends AlovaGenerics> = <Data = any>(
  eventName: string,
  handler: (event: AlovaSSEMessageEvent<Data, AG>) => void
) => () => void;

/**
 *  useSSE() 配置项
 */
export interface SSEHookConfig {
  /**
   * 会传给new EventSource
   */
  withCredentials?: boolean;

  /**
   * 是否经过alova实例的responded拦截
   * @default true
   */
  interceptByGlobalResponded?: boolean;

  /**
   * 初始数据
   */
  initialData?: any;

  /**
   * 是否立即发起请求
   * @default false
   */
  immediate?: boolean;

  /**
   * 是否中断上一个请求并触发本次的请求
   * @default true
   * TODO 暂不支持指定
   */
  abortLast?: true;
}

/**
 * useSSE() 返回类型
 */
export interface SSEExposure<AG extends AlovaGenerics, Data> {
  readyState: ExportedState<SSEHookReadyState, AG['State']>;
  data: ExportedState<Data | undefined, AG['State']>;
  eventSource: ExportedState<EventSource | undefined, AG['State']>;
  /**
   * 手动发起请求。在使用 `immediate: true` 时该方法会自动触发
   * @param sendArgs 请求参数，会传递给 method
   */
  send(...sendArgs: any[]): Promise<void>;
  /**
   * 关闭连接
   */
  close(): void;
  /**
   * 注册 EventSource open 的回调函数
   * @param callback 回调函数
   * @returns 取消注册函数
   */
  onOpen(callback: SSEOnOpenTrigger<AG>): this;

  /**
   * 注册 EventSource message 的回调函数
   * @param callback 回调函数
   * @returns 取消注册函数
   */
  onMessage<T = Data>(callback: SSEOnMessageTrigger<T, AG>): this;

  /**
   * 注册 EventSource error 的回调函数
   * @param callback 回调函数
   * @returns 取消注册函数
   */
  onError(callback: SSEOnErrorTrigger<AG>): this;

  /**
   * @param eventName 事件名称，默认存在 `open` | `error` | `message`
   * @param handler 事件处理器
   */
  on: SSEOn<AG>;
}

/**
 * useSSE
 * 使用 Server-sent events 发送请求
 *
 *
 * @param handler method获取函数
 * @param config 配置参数
 * @return useSSE相关数据和操作函数
 */
export declare function useSSE<Data = any, AG extends AlovaGenerics = AlovaGenerics>(
  handler: Method<AG> | AlovaMethodHandler<AG>,
  config?: SSEHookConfig
): SSEExposure<AG, Data>;
