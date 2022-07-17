import {
  AlovaOptions,
  AlovaMethodConfig,
  RequestBody,
  Storage,
} from '../typings';
import Method, { typeDelete, typeGet, typeHead, typeOptions, typePatch, typePost, typePut } from './Method';

let idCounter = 0;
export default class Alova<S, E, RC, RE, RH> {
  public options: AlovaOptions<S, E, RC, RE, RH>;
  public id = `alova-${++idCounter}`;
  public storage: Storage;
  constructor(options: AlovaOptions<S, E, RC, RE, RH>) {
    // 如果storage未指定，则默认使用localStorage
    this.storage = options.storageAdapter || window.localStorage;
    this.options = options;
  }
  Get<R, T = unknown>(url: string, config?: AlovaMethodConfig<R, T, RC, RH>) {
    return new Method<S, E, R, T, RC, RE, RH>(typeGet, this, url, config);
  }
  Post<R, T = unknown>(url: string, data: RequestBody = {}, config?: AlovaMethodConfig<R, T, RC, RH>) {
    return new Method<S, E, R, T, RC, RE, RH>(typePost, this, url, config, data);
  }
  Delete<R, T = unknown>(url: string, data: RequestBody = {}, config?: AlovaMethodConfig<R, T, RC, RH>) {
    return new Method<S, E, R, T, RC, RE, RH>(typeDelete, this, url, config, data);
  }
  Put<R, T = unknown>(url: string, data: RequestBody = {}, config?: AlovaMethodConfig<R, T, RC, RH>) {
    return new Method<S, E, R, T, RC, RE, RH>(typePut, this, url, config, data);
  }
  Head<R, T = unknown>(url: string, config?: AlovaMethodConfig<R, T, RC, RH>) {
    return new Method<S, E, R, T, RC, RE, RH>(typeHead, this, url, config);
  }
  Patch<R, T = unknown>(url: string, data: RequestBody = {}, config?: AlovaMethodConfig<R, T, RC, RH>) {
    return new Method<S, E, R, T, RC, RE, RH>(typePatch, this, url, config, data);
  }
  Options<R, T = unknown>(url: string, config?: AlovaMethodConfig<R, T, RC, RH>) {
    return new Method<S, E, R, T, RC, RE, RH>(typeOptions, this, url, config);
  }
}