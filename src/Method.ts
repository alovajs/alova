import { AlovaMethodConfig, MethodRequestConfig, MethodType, ProgressHandler, RequestBody } from '~/typings';
import Alova from './Alova';
import sendRequest from './functions/sendRequest';
import {
  getConfig,
  getContextOptions,
  getMethodInternalKey,
  instanceOf,
  isPlainObject,
  key,
  noop
} from './utils/helper';
import {
  deleteAttr,
  falseValue,
  forEach,
  isArray,
  len,
  mapItem,
  promiseCatch,
  promiseFinally,
  promiseThen,
  pushItem,
  undefinedValue
} from './utils/variables';

const offEventCallback = (offHandler: any, handlers: any[]) => () => {
  const index = handlers.indexOf(offHandler);
  index >= 0 && handlers.splice(index, 1);
};

export const typeGet = 'GET';
export const typeHead = 'HEAD';
export const typePost = 'POST';
export const typePut = 'PUT';
export const typePatch = 'PATCH';
export const typeDelete = 'DELETE';
export const typeOptions = 'OPTIONS';
export default class Method<S = any, E = any, R = any, T = any, RC = any, RE = any, RH = any> {
  public type: MethodType;
  public baseURL: string;
  public url: string;
  public config: MethodRequestConfig & AlovaMethodConfig<R, T, RC, RH>;
  public data?: RequestBody;
  public hitSource?: (string | RegExp)[];
  public context: Alova<S, E, RC, RE, RH>;
  public dhs: ProgressHandler[] = [];
  public uhs: ProgressHandler[] = [];
  public meta?: any;
  public __key__: string;

  /**
   * 请求中断函数，每次请求都会更新这个函数
   */
  public abort = noop;
  public fromCache: boolean | undefined = undefinedValue;
  constructor(
    type: MethodType,
    context: Alova<S, E, RC, RE, RH>,
    url: string,
    config?: AlovaMethodConfig<R, T, RC, RH>,
    data?: RequestBody
  ) {
    const instance = this,
      contextOptions = getContextOptions(context);
    instance.baseURL = contextOptions.baseURL || '';
    instance.url = url;
    instance.type = type;
    instance.context = context;

    // 将请求相关的全局配置合并到Method对象中
    const contextConcatConfig: any = {},
      mergedLocalCacheKey = 'localCache',
      globalLocalCache = isPlainObject(contextOptions[mergedLocalCacheKey])
        ? contextOptions[mergedLocalCacheKey][type]
        : undefinedValue,
      hitSource = config && config.hitSource;

    // 合并参数
    forEach(['timeout', 'shareRequest'], mergedKey => {
      if (contextOptions[mergedKey as keyof typeof contextOptions] !== undefinedValue) {
        contextConcatConfig[mergedKey] = contextOptions[mergedKey as keyof typeof contextOptions];
      }
    });

    // 合并localCache
    if (globalLocalCache !== undefinedValue) {
      contextConcatConfig[mergedLocalCacheKey] = globalLocalCache;
    }

    // 将hitSource统一处理成数组，且当有method实例时将它们转换为methodKey
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
    instance.meta = config && config.meta;

    // 在外部需要使用原始的key，而不是实时生成key
    // 原因是，method的参数可能传入引用类型值，但引用类型值在外部改变时，实时生成的key也随之改变，因此使用最开始的key更准确
    instance.__key__ = key(instance);
  }

  /**
   * 绑定下载进度回调函数
   * @param progressHandler 下载进度回调函数
   * @version 2.17.0
   * @return 解绑函数
   */
  public onDownload(downloadHandler: ProgressHandler) {
    pushItem(this.dhs, downloadHandler);
    return offEventCallback(downloadHandler, this.dhs);
  }

  /**
   * 绑定上传进度回调函数
   * @param progressHandler 上传进度回调函数
   * @version 2.17.0
   * @return 解绑函数
   */
  public onUpload(uploadHandler: ProgressHandler) {
    pushItem(this.uhs, uploadHandler);
    return offEventCallback(uploadHandler, this.uhs);
  }

  /**
   * 通过method实例发送请求，返回promise对象
   */
  public send(forceRequest = falseValue): Promise<R> {
    const instance = this,
      { response, onDownload, onUpload, abort, fromCache } = sendRequest(instance, forceRequest);
    len(instance.dhs) > 0 &&
      onDownload((total, loaded) => forEach(instance.dhs, handler => handler({ total, loaded })));
    len(instance.uhs) > 0 && onUpload((total, loaded) => forEach(instance.uhs, handler => handler({ total, loaded })));

    // 每次请求时将中断函数绑定给method实例，使用者也可通过methodInstance.abort()来中断当前请求
    instance.abort = abort;
    instance.fromCache = undefinedValue;
    return promiseThen(response(), r => {
      instance.fromCache = fromCache();
      return r;
    });
  }

  /**
   * 设置方法名称，如果已有名称将被覆盖
   * @param name 方法名称
   */
  public setName(name: string | number) {
    getConfig(this).name = name;
  }

  /**
   * 绑定resolve和/或reject Promise的callback
   * @param onfullified resolve Promise时要执行的回调
   * @param onrejected 当Promise被reject时要执行的回调
   * @returns 返回一个Promise，用于执行任何回调
   */
  public then<TResult1 = R, TResult2 = never>(
    onfulfilled?: (value: R) => TResult1 | PromiseLike<TResult1>,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ) {
    return promiseThen(this.send(), onfulfilled, onrejected);
  }

  /**
   * 绑定一个仅用于reject Promise的回调
   * @param onrejected 当Promise被reject时要执行的回调
   * @returns 返回一个完成回调的Promise
   */
  public catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null) {
    return promiseCatch(this.send(), onrejected);
  }

  /**
   * 绑定一个回调，该回调在Promise结算（resolve或reject）时调用
   * @param onfinally Promise结算（resolve或reject）时执行的回调。
   * @return 返回一个完成回调的Promise。
   */
  public finally(onfinally?: (() => void) | undefined | null) {
    return promiseFinally(this.send(), onfinally);
  }
}
