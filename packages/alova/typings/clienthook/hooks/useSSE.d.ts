import { AlovaGenerics, Method } from 'alova';
import { AlovaEvent, AlovaMethodHandler, ExportedState } from '../general';

type SSEHookReadyState = 0 | 1 | 2;

export interface AlovaSSEEvent<AG extends AlovaGenerics, Args extends any[] = any[]> extends AlovaEvent<AG, Args> {
  method: Method;
  eventSource: EventSource; // Event source instance
}
export interface AlovaSSEErrorEvent<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends AlovaSSEEvent<AG, Args> {
  error: Error; // error object
}
export interface AlovaSSEMessageEvent<Data, AG extends AlovaGenerics, Args extends any[] = any[]>
  extends AlovaSSEEvent<AG, Args> {
  data: Data; // Data converted by the interceptor for each response
}
export type SSEOnOpenTrigger<AG extends AlovaGenerics, Args extends any[] = any[]> = (
  event: AlovaSSEEvent<AG, Args>
) => void;
export type SSEOnMessageTrigger<Data, AG extends AlovaGenerics, Args extends any[]> = (
  event: AlovaSSEMessageEvent<Data, AG, Args>
) => void;
export type SSEOnErrorTrigger<AG extends AlovaGenerics, Args extends any[] = any[]> = (
  event: AlovaSSEErrorEvent<AG, Args>
) => void;
export type SSEOn<AG extends AlovaGenerics, Args extends any[] = any[]> = <Data = any>(
  eventName: string,
  handler: (event: AlovaSSEMessageEvent<Data, AG, Args>) => void
) => () => void;

/**
 *  useSSE() configuration item
 */
export interface SSEHookConfig {
  /**
   * Will be passed to new EventSource
   */
  withCredentials?: boolean;

  /**
   * Whether to pass the responded interception of the alova instance
   * @default true
   */
  interceptByGlobalResponded?: boolean;

  /**
   * initial data
   */
  initialData?: any;

  /**
   * Whether to initiate a request immediately
   * @default false
   */
  immediate?: boolean;

  /**
   * Whether to interrupt the previous request and trigger this request
   * @default true
   * TODO does not currently support specifying
   */
  abortLast?: true;
}

/**
 * useSSE() return type
 */
export interface SSEExposure<AG extends AlovaGenerics, Data, Args extends any[] = any[]> {
  readyState: ExportedState<SSEHookReadyState, AG['StatesExport']>;
  data: ExportedState<Data | undefined, AG['StatesExport']>;
  eventSource: ExportedState<EventSource | undefined, AG['StatesExport']>;
  /**
   * Make the request manually. This method is automatically triggered when using `immediate: true`
   * @param args Request parameters will be passed to method
   */
  send(...args: [...Args, ...any[]]): Promise<void>;
  /**
   * close connection
   */
  close(): void;
  /**
   * Register the callback function of EventSource open
   * @param callback callback function
   * @returns Unregister function
   */
  onOpen(callback: SSEOnOpenTrigger<AG, Args>): this;

  /**
   * Register the callback function for EventSource message
   * @param callback callback function
   * @returns Unregister function
   */
  onMessage<T = Data>(callback: SSEOnMessageTrigger<T, AG, Args>): this;

  /**
   * Register the callback function for EventSource error
   * @param callback callback function
   * @returns Unregister function
   */
  onError(callback: SSEOnErrorTrigger<AG, Args>): this;

  /**
   * @param eventName Event name, default exists `open` | `error` | `message`
   * @param handler event handler
   */
  on: SSEOn<AG>;
}

/**
 * useSSE
 * Send requests using Server-sent events
 *
 *
 * @param handler methodget function
 * @param config Configuration parameters
 * @return useSSE related data and operation functions
 */
export declare function useSSE<Data = any, AG extends AlovaGenerics = AlovaGenerics, Args extends any[] = any[]>(
  handler: Method<AG> | AlovaMethodHandler<AG, Args>,
  config?: SSEHookConfig
): SSEExposure<AG, Data, Args>;
