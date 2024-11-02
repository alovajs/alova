import {
  deleteAttr,
  falseValue,
  forEach,
  getConfig,
  getContextOptions,
  getMethodInternalKey,
  instanceOf,
  isArray,
  isPlainObject,
  key,
  len,
  mapItem,
  noop,
  promiseCatch,
  promiseFinally,
  promiseThen,
  pushItem,
  undefinedValue
} from '@alova/shared';
import {
  AbortFunction,
  Alova,
  AlovaGenerics,
  AlovaMethodConfig,
  MethodRequestConfig,
  MethodType,
  ProgressHandler,
  RequestBody
} from '~/typings';
import sendRequest from './functions/sendRequest';

const offEventCallback = (offHandler: any, handlers: any[]) => () => {
  const index = handlers.indexOf(offHandler);
  index >= 0 && handlers.splice(index, 1);
};

export default class Method<AG extends AlovaGenerics = any> {
  public type: MethodType;

  public baseURL: string;

  public url: string;

  public config: MethodRequestConfig & AlovaMethodConfig<AG, AG['Responded'], AG['Transformed']>;

  public data?: RequestBody;

  public hitSource?: (string | RegExp)[];

  public context: Alova<AG>;

  public dhs: ProgressHandler[] = [];

  public uhs: ProgressHandler[] = [];

  public meta?: any;

  public key: string;

  public promise?: Promise<AG['Responded']>;

  /**
   * Request interrupt function, this function will be updated with each request
   */
  public abort: AbortFunction;

  public fromCache: boolean | undefined = undefinedValue;

  [Symbol.toStringTag]: string;

  constructor(
    type: MethodType,
    context: Alova<AG>,
    url: string,
    config?: AlovaMethodConfig<AG, AG['Responded'], AG['Transformed']>,
    data?: RequestBody
  ) {
    const abortRequest: AbortFunction = () => {
      abortRequest.a();
    };
    abortRequest.a = noop;

    const instance = this;
    const contextOptions = getContextOptions(context);
    instance.abort = abortRequest;
    instance.baseURL = contextOptions.baseURL || '';
    instance.url = url;
    instance.type = type;
    instance.context = context;

    // Merge request-related global configuration into the method object
    const contextConcatConfig: any = {};
    const mergedLocalCacheKey = 'cacheFor';
    const globalLocalCache = isPlainObject(contextOptions[mergedLocalCacheKey])
      ? contextOptions[mergedLocalCacheKey][type]
      : undefinedValue;
    const hitSource = config && config.hitSource;

    // Merge parameters
    forEach(['timeout', 'shareRequest'] as const, mergedKey => {
      if (contextOptions[mergedKey] !== undefinedValue) {
        contextConcatConfig[mergedKey] = contextOptions[mergedKey];
      }
    });

    // Merge local cache
    if (globalLocalCache !== undefinedValue) {
      contextConcatConfig[mergedLocalCacheKey] = globalLocalCache;
    }

    // Unify hit sources into arrays and convert them into method keys when there are method instances
    if (hitSource) {
      instance.hitSource = mapItem(isArray(hitSource) ? hitSource : [hitSource], sourceItem =>
        instanceOf(sourceItem, Method) ? getMethodInternalKey(sourceItem) : (sourceItem as string | RegExp)
      );
      deleteAttr(config, 'hitSource');
    }
    instance.config = {
      ...contextConcatConfig,
      headers: {},
      params: {},
      ...(config || {})
    };
    instance.data = data;
    instance.meta = config ? config.meta : instance.meta;

    // The original key needs to be used externally instead of generating the key in real time.
    // The reason is that the parameters of the method may pass in reference type values, but when the reference type value changes externally, the key generated in real time also changes, so it is more accurate to use the initial key.
    instance.key = instance.generateKey();
  }

  /**
   * Bind download progress callback function
   * @param progressHandler Download progress callback function
   * @version 2.17.0
   * @return unbind function
   */
  public onDownload(downloadHandler: ProgressHandler) {
    pushItem(this.dhs, downloadHandler);
    return offEventCallback(downloadHandler, this.dhs);
  }

  /**
   * Bind upload progress callback function
   * @param progressHandler Upload progress callback function
   * @version 2.17.0
   * @return unbind function
   */
  public onUpload(uploadHandler: ProgressHandler) {
    pushItem(this.uhs, uploadHandler);
    return offEventCallback(uploadHandler, this.uhs);
  }

  /**
   * Send a request through a method instance and return a promise object
   */
  public send(forceRequest = falseValue): Promise<AG['Responded']> {
    const instance = this;
    const { response, onDownload, onUpload, abort, fromCache } = sendRequest(instance, forceRequest);
    len(instance.dhs) > 0 &&
      onDownload((loaded, total) => forEach(instance.dhs, handler => handler({ loaded, total })));
    len(instance.uhs) > 0 && onUpload((loaded, total) => forEach(instance.uhs, handler => handler({ loaded, total })));

    // The interrupt function is bound to the method instance for each request. The user can also interrupt the current request through method instance.abort()
    instance.abort.a = abort;
    instance.fromCache = undefinedValue;
    instance.promise = promiseThen(response(), r => {
      instance.fromCache = fromCache();
      return r;
    });
    return instance.promise;
  }

  /**
   * Set the method name, if there is already a name it will be overwritten
   * @param name method name
   */
  public setName(name: string | number) {
    getConfig(this).name = name;
  }

  public generateKey(): string {
    return key(this);
  }

  /**
   * Bind callbacks for resolve and/or reject Promise
   * @param onfulfilled The callback to be executed when resolving the Promise
   * @param onrejected The callback to be executed when the Promise is rejected
   * @returns Returns a Promise for executing any callbacks
   */
  public then<TResult1 = AG['Responded'], TResult2 = never>(
    onfulfilled?: ((value: AG['Responded']) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): Promise<TResult1 | TResult2> {
    return promiseThen(this.send(), onfulfilled, onrejected);
  }

  /**
   * Bind a callback only for reject Promise
   * @param onrejected The callback to be executed when the Promise is rejected
   * @returns Returns a Promise that completes the callback
   */
  public catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined
  ): Promise<AG['Responded'] | TResult> {
    return promiseCatch(this.send(), onrejected);
  }

  /**
   * Bind a callback that is called when the Promise is resolved (resolve or reject)
   * @param onfinally Callback executed when Promise is resolved (resolve or reject).
   * @return Returns a Promise that completes the callback.
   */
  public finally(onfinally?: (() => void) | null | undefined): Promise<AG['Responded']> {
    return promiseFinally(this.send(), onfinally);
  }
}
