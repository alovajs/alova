import {
  AlovaOptions,
  MethodConfig,
  RequestBody,
  Storage,
} from '../typings';
import Method, { typeDelete, typeGet, typeHead, typeOptions, typePatch, typePost, typePut } from './Method';

let idCounter = 0;
export default class Alova<S, E> {
  public options: AlovaOptions<S, E>;
  public id = `alova-${++idCounter}`;
  public storage: Storage;
  constructor(options: AlovaOptions<S, E>) {
    // 如果storage未指定，则默认使用localStorage
    this.storage = options.storageAdapter || window.localStorage;
    this.options = options;
  }
  Get<R, T = any>(url: string, config?: MethodConfig<R, T>) {
    return new Method<S, E, R, T>(typeGet, this, url, config);
  }
  Post<R, T = any>(url: string, data: RequestBody = {}, config: MethodConfig<R, T> = {}) {
    return new Method<S, E, R, T>(typePost, this, url, config, data);
  }
  Delete<R, T = any>(url: string, data: RequestBody = {}, config: MethodConfig<R, T> = {}) {
    return new Method<S, E, R, T>(typeDelete, this, url, config, data);
  }
  Put<R, T = any>(url: string, data: RequestBody = {}, config: MethodConfig<R, T> = {}) {
    return new Method<S, E, R, T>(typePut, this, url, config, data);
  }
  Head<R, T = any>(url: string, config: MethodConfig<R, T> = {}) {
    return new Method<S, E, R, T>(typeHead, this, url, config);
  }
  Patch<R, T = any>(url: string, data: RequestBody = {}, config: MethodConfig<R, T> = {}) {
    return new Method<S, E, R, T>(typePatch, this, url, config, data);
  }
  Options<R, T = any>(url: string, config: MethodConfig<R, T> = {}) {
    return new Method<S, E, R, T>(typeOptions, this, url, config);
  }
}