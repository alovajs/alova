import { EventManager, FrameworkState } from '@alova/shared';

export interface AlovaGenerics<
  R = any,
  T = any,
  RC = any,
  RE = any,
  RH = any,
  L1 extends AlovaGlobalCacheAdapter = any,
  L2 extends AlovaGlobalCacheAdapter = any,
  SE extends StatesExport<any> = any
> {
  Responded: R;
  Transformed: T;
  RequestConfig: RC;
  Response: RE;
  ResponseHeader: RH;
  L1Cache: L1;
  L2Cache: L2;
  StatesExport: SE;
}

type Arg = Record<string, any>;
export type RequestBody = Arg | string | FormData | Blob | ArrayBuffer | URLSearchParams | ReadableStream;

/**
 * Request elements, information necessary to send a request
 */
export interface RequestElements {
  readonly url: string;
  readonly type: MethodType;
  readonly headers: Arg;
  readonly data?: RequestBody;
}
export type ProgressUpdater = (loaded: number, total: number) => void;
export type AlovaRequestAdapter<RequestConfig, Response, ResponseHeader> = (
  elements: RequestElements,
  method: Method<AlovaGenerics<any, any, RequestConfig, Response, ResponseHeader>>
) => {
  response: () => Promise<Response>;
  headers: () => Promise<ResponseHeader>;
  onDownload?: (handler: ProgressUpdater) => void;
  onUpload?: (handler: ProgressUpdater) => void;
  abort: () => void;
};

export type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH';

/**
 * provide user to custom some types
 * 1. meta: custom metadata type.
 * 2. statesHook: custom the global states hook type.
 */
export interface AlovaCustomTypes {
  [customKey: string]: any;
}

export interface AlovaGlobalCacheAdapter {
  /**
   * save or update cache
   * @param key key
   * @param value value
   */
  set(key: string, value: any): void | Promise<void>;

  /**
   * get value by key
   * @param key key
   */
  get<T>(key: string): T | undefined | Promise<T | undefined>;

  /**
   * remove item
   * @param key key
   */
  remove(key: string): void | Promise<void>;

  /**
   * clear all cache.
   */
  clear(): void | Promise<void>;
}

interface CacheEvent {
  type: 'set' | 'get' | 'remove' | 'clear';
  key: string;
  value?: any;
  container: Record<string, any>;
}
export interface AlovaDefaultCacheAdapter extends AlovaGlobalCacheAdapter {
  /**
   * the events related to cache operating emitter.
   */
  readonly emitter: EventManager<{ success: CacheEvent; fail: Omit<CacheEvent, 'value'> }>;
}

/**
 * Request cache settings
 * expire: expiration time
 *  1. When set to a number: if it is greater than 0, the cached data will be returned first, the expiration time unit is milliseconds, if it is less than or equal to 0, it will not be cached, and Infinity will never expire;
 *  2. When set to a Date object, it means
 * mode: cache mode, optional values are memory, restore
 */
export type CacheExpire = number | Date | null;
export type CacheMode = 'memory' | 'restore';
export type CacheExpireGetter<AG extends AlovaGenerics> = (event: {
  method: Method<AG>;
  mode: CacheMode;
}) => CacheExpire;
export type DetailCacheConfig<AG extends AlovaGenerics> = {
  expire: CacheExpire | CacheExpireGetter<AG>;
  mode?: CacheMode;

  /** Persistent cache tags, the original persistent data will be invalid after the tag is changed. */
  tag?: string | number;
};
export type CacheConfig<AG extends AlovaGenerics> = CacheExpire | DetailCacheConfig<AG>;
export type CacheController<Responded> = () => Responded | undefined | Promise<Responded | undefined>;
export interface MethodRequestConfig {
  /**
   * url parameters
   */
  params: Arg;

  /**
   * Request header
   */
  headers: Arg;
}
export type AlovaMethodConfig<AG extends AlovaGenerics, Responded, Transformed> = {
  /**
   * The name of the method object. The corresponding method object can be obtained by name or wildcard in the updateState, invalidateCache, setCache, and fetch functions.
   */
  name?: string | number;

  /**
   * current outage time
   */
  timeout?: number;

  /**
   * The response data will not be requested again within the cache time. Get requests are cached for 5 minutes (300000 milliseconds) by default, and other requests are not cached by default.
   */
  cacheFor?: CacheConfig<RespondedAlovaGenerics<AG, Responded, Transformed>> | CacheController<Responded>;

  /**
   * Hit the source method instance. When the source method instance request is successful, the cache of the current method instance will be invalidated.
   * As an automatic invalidation function, you only need to set the hit source instead of manually calling invalidateCache to invalidate the cache.
   * At the same time, this function is more concise than the invalidateCache method in complex invalidation relationships.
   * The value of this field can be set to the method instance, the name of other method instances, name regular matching, or their array
   */
  hitSource?: string | RegExp | Method | (string | RegExp | Method)[];

  /**
   * Response data conversion. The converted data will be converted into data state. If there is no converted data, the response data will be used directly as data state.
   */
  transform?: (data: Transformed, headers: AG['ResponseHeader']) => Responded | Promise<Responded>;

  /**
   * Request level sharing request switch
   * After the sharing request is enabled, the same request will be shared when the same request is initiated at the same time.
   * When set here, it will overwrite the global settings.
   */
  shareRequest?: boolean;

  /**
   * method metadata
   */
  meta?: AlovaCustomTypes['meta'];
} & AG['RequestConfig'];
export type AlovaMethodCreateConfig<AG extends AlovaGenerics, Responded, Transformed> = Partial<MethodRequestConfig> &
  AlovaMethodConfig<AG, Responded, Transformed>;

export type RespondedHandler<AG extends AlovaGenerics> = (response: AG['Response'], methodInstance: Method<AG>) => any;
export type ResponseErrorHandler<AG extends AlovaGenerics> = (
  error: any,
  methodInstance: Method<AG>
) => void | Promise<void>;
export type ResponseCompleteHandler<AG extends AlovaGenerics> = (methodInstance: Method<AG>) => any;
export type RespondedHandlerRecord<AG extends AlovaGenerics> = {
  /**
   * Global request success hook function
   * If an error is thrown in global onSuccess, the global onError will not be triggered, but the onError of the requested location will be triggered.
   */
  onSuccess?: RespondedHandler<AG>;

  /**
   * Global request error hook function. Request error refers to a network request failure. Error codes such as 404 and 500 returned by the server will not enter this hook function.
   * When the global onError is specified to capture the error, if no error is thrown, the onSuccess of the requested location will be triggered.
   */
  onError?: ResponseErrorHandler<AG>;

  /**
   * Request completion hook function
   * This hook function will be triggered if the request is successful, the cache match is successful, or the request fails.
   */
  onComplete?: ResponseCompleteHandler<AG>;
};

export interface FetchRequestState<L = any, E = any, D = any, U = any> {
  loading: L;
  error: E;
  downloading: D;
  uploading: U;
}
export interface FrontRequestState<L = any, R = any, E = any, D = any, U = any> extends FetchRequestState<L, E, D, U> {
  data: R;
}

export type MergedStatesMap = Record<string, FrameworkState<any, string>>;
export interface EffectRequestParams<E> {
  handler: (...args: any[]) => void;
  removeStates: () => void;
  saveStates: (frontStates: MergedStatesMap) => void;
  frontStates: MergedStatesMap;
  watchingStates?: E[];
  immediate: boolean;
}

export interface ReferingObject {
  /**
   * the map of tracked state keys
   */
  trackedKeys: Record<string, boolean>;
  /**
   * has been bound error event
   */
  bindError: boolean;
  [key: string]: any;
}
export type StatesExportHelper<I extends StatesExport<any>> = I;

export interface StatesExport<T = any> {
  name: string;
  State: T;
  Computed: T;
  Watched: T;
  StateExport: T;
  ComputedExport: T;
}

export interface StatesHook<SE extends StatesExport<any>> {
  name: SE['name'];
  /**
   * Create status
   * @param initialValue initial data
   * @returns status value
   */
  create: (initialValue: any, key: string, referingObject: ReferingObject) => SE['State'];

  /**
   * create computed state
   * @param initialValue initial data
   * @param key attribute name
   * @param referingObject refering object
   */
  computed: (
    getter: () => any,
    deps: (SE['StateExport'] | SE['ComputedExport'])[],
    key: string,
    referingObject: ReferingObject
  ) => SE['Computed'];

  /**
   * Values exported for use by developers
   * @param state status value
   * @param referingObject referring object
   * @returns exported value
   */
  export?: (state: SE['State'], referingObject: ReferingObject) => SE['StateExport'] | SE['ComputedExport'];

  /** Convert state to normal data */
  dehydrate: (state: SE['State'], key: string, referingObject: ReferingObject) => any;

  /**
   * Update status value
   * @param newVal new data collection
   * @param state original state value
   * @param key attribute name
   * @param @param referingObject referring object
   */
  update: (newVal: any, state: SE['State'], key: string, referingObject: ReferingObject) => void;

  /**
   * Controls the function that executes the request. This function will be executed once when useRequest and useWatcher are called.
   * Execute once in the fetch function in useFetcher
   * When watchingStates is an empty array, execute the handleRequest function once
   * When watchingStates is a non-empty array, it is called when the state changes. When immediate is true, it needs to be called immediately.
   * Hook is an instance of use hook. Each time use hook is called, a hook instance will be generated.
   * It can be executed directly in vue, but in react it needs to be executed in useEffect
   * The removeStates function is a function that clears the current state and should be called when the component is unloaded.
   */
  effectRequest: (effectParams: EffectRequestParams<any>, referingObject: ReferingObject) => void;

  /**
   * Packaging use hooks operation functions such as send and abort
   * This is mainly used to optimize the problem that new functions will be generated every time rendering in react to optimize performance.
   * @param fn use hook operation function
   * @returns Wrapped operation function
   */
  memorize?: <Callback extends (...args: any[]) => any>(fn: Callback) => Callback;

  /**
   * Create reference object
   * @param initialValue initial value
   * @returns a reference object containing the initial value
   */
  ref?: <D>(initialValue: D) => { current: D };

  /**
   * watch states
   * @param source watching source
   * @param callback callback when states changes
   * @param referingObject refering object
   */
  watch: (source: SE['Watched'][], callback: () => void, referingObject: ReferingObject) => void;

  /**
   * bind mounted callback.
   * @param callback callback on component mounted
   * @param referingObject refering object
   */
  onMounted: (callback: () => void, referingObject: ReferingObject) => void;

  /**
   * bind unmounted callback.
   * @param callback callback on component unmounted
   * @param referingObject refering object
   */
  onUnmounted: (callback: () => void, referingObject: ReferingObject) => void;
}

export type GlobalCacheConfig<AG extends AlovaGenerics> = Partial<Record<MethodType, CacheConfig<AG>>> | null;
export type CacheLoggerHandler<AG extends AlovaGenerics> = (
  response: any,
  methodInstance: Method<AG>,
  cacheMode: CacheMode,
  tag: DetailCacheConfig<AG>['tag']
) => void | Promise<void>;
/**
 * Generic type explanation:
 * State: The type of state group created by the create function
 * Computed: The computed property value created by the computed function
 * Watched: listener type
 * Export: The type of status group returned by the export function
 * RequestConfig: the request configuration type of requestAdapter, automatically inferred
 * Response: response configuration type of type requestAdapter, automatically inferred
 * ResponseHeader: response header type of requestAdapter, automatically inferred
 */
export interface AlovaOptions<AG extends AlovaGenerics> {
  /**
   * custom alova id
   *
   * **Recommend to custom it in multiple server scenarios**from 0 in creating order
   */
  id?: number | string;

  /**
   * base url
   */
  baseURL?: string;

  /**
   * State hook function, used to define and update the state of the specified MVVM library
   */
  statesHook?: StatesHook<AG['StatesExport']>;

  /**
   * request adapter.
   * all request of alova will be sent by it.
   */
  requestAdapter: AlovaRequestAdapter<AG['RequestConfig'], AG['Response'], AG['ResponseHeader']>;

  /**
   * global timeout. unit is millisecond.
   */
  timeout?: number;

  /**
   * Global request local cache settings
   * expire: Expiration time. If it is greater than 0, the cached data will be returned first. The expiration time unit is milliseconds. If it is less than or equal to 0, it will not be cached. Infinity will never expire.
   * mode: cache mode, optional values are memory, restore
   * Get requests are cached for 5 minutes (300000 milliseconds) by default, and other requests are not cached by default.
   * @default { GET: 300000 }
   */
  cacheFor?: GlobalCacheConfig<AG>;

  /**
   * memory mode cache adapter. it will be used when caching data with memory mode.
   * it's an js's object default.
   * you can set your own adapter with sync/async function of set/get/remove.
   * see [https://alova.js.org/tutorial/custom/custom-storage-adapter]
   */
  l1Cache?: AG['L1Cache'];

  /**
   * restore mode cache adapter. it will be used when persist data.
   * default behavior:
   * -browser/deno: localStorage.
   * -nodejs/bun: no adapter.(you can use @alova/cache-file).
   * see [https://alova.js.org/tutorial/custom/custom-storage-adapter]
   */
  l2Cache?: AG['L2Cache'];

  /**
   * global before request hook
   */
  beforeRequest?: (method: Method<AG>) => void | Promise<void>;

  /**
   * A global response hook, which can be passed or set as an object with onSuccess, onError, and onComplete, to represent the request success and request error hooks.
   * If an error is thrown in global onSuccess, the global onError will not be triggered, but the onError of the requested location will be triggered.
   * When the global onError is specified to capture the error, if no error is thrown, the onSuccess of the requested location will be triggered.
   * @version 2.1.0
   */
  responded?: RespondedHandler<AG> | RespondedHandlerRecord<AG>;

  /**
   * Global sharing request switch
   * After the sharing request is enabled, the same request will be shared when the same request is initiated at the same time.
   * @default true
   */
  shareRequest?: boolean;

  /**
   * Cache log printing
   * When the response cache is hit, matching cache information will be printed on the console by default to remind developers
   * When set to false or null, the log will not be printed.
   * When set as a custom function, it will custom take over the task of cache matching.
   * @version 2.8.0
   * @default true
   */
  cacheLogger?: boolean | null | CacheLoggerHandler<AG>;

  /**
   * limitation of method snapshots.
   * it indicates not save snapshot when value is set to 0, and the method matcher will not work.
   * @default 1000
   */
  snapshots?: number;
}

/** progress information */
export type Progress = {
  total: number;
  loaded: number;
};
export type ProgressHandler = (progress: Progress) => void;

export interface AbortFunction {
  (): void;
  a: () => void;
}

/**
 * Request method type
 */
export declare class Method<AG extends AlovaGenerics = any> extends Promise<AG['Responded']> {
  constructor(
    type: MethodType,
    context: Alova<AG>,
    url: string,
    config?: AlovaMethodCreateConfig<AG, AG['Responded'], AG['Transformed']>,
    data?: RequestBody
  );

  /**
   * baseURL of alova instance
   */
  baseURL: string;

  /**
   * Request url
   */
  url: string;

  /**
   * Request type
   */
  type: MethodType;

  /**
   * method configuration
   */
  config: MethodRequestConfig & AlovaMethodConfig<AG, AG['Responded'], AG['Transformed']>;

  /**
   * Request body
   */
  data?: RequestBody;

  /**
   * Cache hit source
   */
  hitSource?: (string | RegExp)[];

  /**
   * alova example
   */
  context: Alova<AG>;

  /**
   * storage key
   */
  key: string;

  /**
   * download event
   * @version 2.17.0
   */
  dhs: ProgressHandler[];

  /**
   * Upload event
   * @version 2.17.0
   */
  uhs: ProgressHandler[];

  /**
   * Whether this response data comes from cache
   * @version 2.17.0
   */
  fromCache: boolean | undefined;

  /**
   * Used to pass additional information in global request and response hook functions
   * Any field can be used in js projects
   */
  meta?: AlovaCustomTypes['meta'];

  /**
   * Request a Promise instance
   */
  promise?: Promise<AG['Responded']>;

  /**
   * Use this method instance to send the request directly
   * @param forceRequest mandatory request
   * @returns Request a Promise instance
   */
  send(forceRequest?: boolean): Promise<AG['Responded']>;

  /**
   * Set name
   * @param name name
   */
  setName(name: string | number): void;

  /**
   * Generate the key of the current method
   */
  generateKey(): string;

  /**
   * Interrupt requests sent directly by this method instance
   */
  abort: AbortFunction;

  /**
   * Bind download progress callback function
   * @param progressHandler Download progress callback function
   * @version 2.17.0
   * @return unbind function
   */
  onDownload(progressHandler: ProgressHandler): () => void;

  /**
   * Bind upload progress callback function
   * @param progressHandler Upload progress callback function
   * @version 2.17.0
   * @return unbind function
   */
  onUpload(progressHandler: ProgressHandler): () => void;
}

export class MethodSnapshotContainer<AG extends AlovaGenerics> {
  records: Record<string, Set<Method<AG>>>;

  capacity: number;

  occupy: number;

  save(methodInstance: Method<AG>): void;

  /**
   * get method snapshots by matcher
   * the method snapshots means the method instance that has been requested
   * @version 3.0.0
   * @param {MethodFilter} matcher method matcher
   * @param {boolean} matchAll is match all, default is true
   * @returns {Method[] | Method} method list when `matchAll` is true, otherwise return method instance or undefined
   */
  match<M extends boolean = true>(
    matcher: MethodFilter<AG>,
    matchAll?: M
  ): M extends true ? Method<AG>[] : Method<AG> | undefined;
}

export type RespondedAlovaGenerics<AG extends AlovaGenerics, Responded, Transformed> = Omit<
  AG,
  'Responded' | 'Transformed'
> & {
  Responded: Responded;
  Transformed: Transformed;
};

export interface Alova<AG extends AlovaGenerics> {
  id: string;
  options: AlovaOptions<AG>;
  l1Cache: AG['L1Cache'];
  l2Cache: AG['L2Cache'];
  snapshots: MethodSnapshotContainer<AG>;
  Get<Responded = unknown, Transformed = unknown>(
    url: string,
    config?: AlovaMethodCreateConfig<AG, Responded, Transformed>
  ): Method<RespondedAlovaGenerics<AG, Responded, Transformed>>;
  Post<Responded = unknown, Transformed = unknown>(
    url: string,
    data?: RequestBody,
    config?: AlovaMethodCreateConfig<AG, Responded, Transformed>
  ): Method<RespondedAlovaGenerics<AG, Responded, Transformed>>;
  Put<Responded = unknown, Transformed = unknown>(
    url: string,
    data?: RequestBody,
    config?: AlovaMethodCreateConfig<AG, Responded, Transformed>
  ): Method<RespondedAlovaGenerics<AG, Responded, Transformed>>;
  Delete<Responded = unknown, Transformed = unknown>(
    url: string,
    data?: RequestBody,
    config?: AlovaMethodCreateConfig<AG, Responded, Transformed>
  ): Method<RespondedAlovaGenerics<AG, Responded, Transformed>>;
  Head<Responded = unknown, Transformed = unknown>(
    url: string,
    config?: AlovaMethodCreateConfig<AG, Responded, Transformed>
  ): Method<RespondedAlovaGenerics<AG, Responded, Transformed>>;
  Options<Responded = unknown, Transformed = unknown>(
    url: string,
    config?: AlovaMethodCreateConfig<AG, Responded, Transformed>
  ): Method<RespondedAlovaGenerics<AG, Responded, Transformed>>;
  Patch<Responded = unknown, Transformed = unknown>(
    url: string,
    data?: RequestBody,
    config?: AlovaMethodCreateConfig<AG, Responded, Transformed>
  ): Method<RespondedAlovaGenerics<AG, Responded, Transformed>>;
}

export interface MethodFilterHandler<AG extends AlovaGenerics> {
  (method: Method<AG>, index: number, methods: Method<AG>[]): boolean;
}

export type MethodDetaiedFilter<AG extends AlovaGenerics> = {
  name?: string | RegExp;
  filter?: MethodFilterHandler<AG>;
};
export type MethodFilter<AG extends AlovaGenerics> = string | RegExp | MethodDetaiedFilter<AG>;

/**
 * alova global configurations.
 */
export interface AlovaGlobalConfig {
  /**
   * switch of auto hit cache.
   * here is three options:
   * -global: invalidate cache cross alova instances.
   * -self: only invalidate cache from the same alova instance.
   * -close: don't auto invalidate cache any more.
   * @default 'global'
   */
  autoHitCache?: 'global' | 'self' | 'close';
  /**
   * whether the app is running in the server
   * If not set or set to `undefined`, alova determines whether it is now running in the server
   * @default undefined
   */
  ssr?: boolean | undefined;
}

// ************ exports ***************
/**
 * create an alova instance.
 * @param options global options
 * @returns alova instance
 */
export declare function createAlova<
  RequestConfig,
  Response,
  ResponseHeader,
  L1Cache extends AlovaGlobalCacheAdapter = AlovaDefaultCacheAdapter,
  L2Cache extends AlovaGlobalCacheAdapter = AlovaDefaultCacheAdapter,
  SE extends StatesExport<any> = StatesExport<any>
>(
  options: AlovaOptions<AlovaGenerics<any, any, RequestConfig, Response, ResponseHeader, L1Cache, L2Cache, SE>>
): Alova<AlovaGenerics<any, any, RequestConfig, Response, ResponseHeader, L1Cache, L2Cache, SE>>;

/**
 * invalidate cache
 * @example
 * ```js
 * // invalidate cache with specific method instance.
 * invalidateCache(alova.Get('/api/profile'));
 *
 * // match method snapshots then invalidate them.
 * const methods = alova.snapshots.match('method-name');
 * invalidateCache(methods);
 *
 * // invalidate all cache.
 * invalidateCache();
 * ```
 * @param matcher Array of method instances or method matcher parameters
 */
export declare function invalidateCache(matcher?: Method | Method[]): Promise<void>;

export interface UpdateOptions {
  onMatch?: (method: Method) => void;
}

export interface CacheSetOptions {
  /**
   * cache policy.
   * -l1: only set l1 cache.
   * -l2: only set l2 cache.
   * -all: set l1 cache and set l2 cache(method cache mode need to be 'restore').
   * @default 'all'
   */
  policy?: 'l1' | 'l2' | 'all';
}
/**
 * set cache manually
 * @example
 * ```js
 * // set static cache
 * setCache(methodInstance, newData);
 *
 * // set cache dynamically
 * setCache(methodInstance, oldData => {
 *   if (oldData.name === 'new name') {
 *     // it indicates that the cache is not updated when returning undefined
 *     return;
 *   }
 *   old.name = 'new name';
 *   return oldData;
 * });
 *
 * // get methods from snapshots
 * const methods = alova.snapshots.match('method-name');
 * setCache(methods, newData);
 * ```
 * @param matcher method instance(s)
 */
export declare function setCache<AG extends AlovaGenerics>(
  matcher: Method<AG> | Method<AG>[],
  dataOrUpdater: AG['Responded'] | ((oldCache: AG['Responded']) => AG['Responded'] | undefined | void),
  options?: CacheSetOptions
): Promise<void>;

export interface CacheQueryOptions {
  /**
   * cache policy.
   * -l1: only query l1 cache.
   * -l2: only query l2 cache.
   * -all: query l1 cache first and query l2 cache if l1 cache not found(method cache mode need to be 'restore').
   * @default 'all'
   */
  policy?: 'l1' | 'l2' | 'all';
}
/**
 * query cache data
 * @example
 * ```js
 *  const cache = queryCache(alova.Get('/api/profile'));
 * ```
 * @param matcher method instance
 * @returns cache data, return undefined if not found
 */
export declare function queryCache<AG extends AlovaGenerics>(
  matcher: Method<AG>,
  options?: CacheQueryOptions
): Promise<AG['Responded'] | undefined>;

/**
 * hit(invalidate) target caches by source method
 * this is the implementation of auto invalidate cache
 * @param sourceMethod source method instance
 * @example
 * ```js
 * await hitCacheBySource(alova.Get('/api/profile'));
 * ```
 */
export declare function hitCacheBySource<AG extends AlovaGenerics>(sourceMethod: Method<AG>): Promise<void>;

export declare const globalConfigMap: Required<AlovaGlobalConfig>;

/**
 * Set global configuration configuration
 */
export declare function globalConfig(config: AlovaGlobalConfig): void;

/**
 * get the unified statesHook, and it will throw error if not set.
 * @returns the unified statesHook
 */
export declare function promiseStatesHook<SE extends StatesExport<any>>(): StatesHook<SE>;
