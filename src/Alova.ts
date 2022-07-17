import {
  AlovaOptions,
  AlovaMethodConfig,
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
  Get<R, T = unknown>(url: string, config?: AlovaMethodConfig<R, T, RequestInit>) {
    return new Method<S, E, R, T>(typeGet, this, url, config);
  }
  Post<R, T = unknown>(url: string, data: RequestBody = {}, config: AlovaMethodConfig<R, T, RequestInit> = {}) {
    return new Method<S, E, R, T>(typePost, this, url, config, data);
  }
  Delete<R, T = unknown>(url: string, data: RequestBody = {}, config: AlovaMethodConfig<R, T, RequestInit> = {}) {
    return new Method<S, E, R, T>(typeDelete, this, url, config, data);
  }
  Put<R, T = unknown>(url: string, data: RequestBody = {}, config: AlovaMethodConfig<R, T, RequestInit> = {}) {
    return new Method<S, E, R, T>(typePut, this, url, config, data);
  }
  Head<R, T = unknown>(url: string, config: AlovaMethodConfig<R, T, RequestInit> = {}) {
    return new Method<S, E, R, T>(typeHead, this, url, config);
  }
  Patch<R, T = unknown>(url: string, data: RequestBody = {}, config: AlovaMethodConfig<R, T, RequestInit> = {}) {
    return new Method<S, E, R, T>(typePatch, this, url, config, data);
  }
  Options<R, T = unknown>(url: string, config: AlovaMethodConfig<R, T, RequestInit> = {}) {
    return new Method<S, E, R, T>(typeOptions, this, url, config);
  }
}