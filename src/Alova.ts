import {
  AlovaOptions,
  MethodConfig,
  Storage,
} from '../typings';
import Delete from './methods/Delete';
import Get from './methods/Get';
import Head from './methods/Head';
import Options from './methods/Options';
import Patch from './methods/Patch';
import Post from './methods/Post';
import Put from './methods/Put';
import Trace from './methods/Trace';

let idCounter = 0;
export type RequestBody = Record<string, any> | FormData | string;
export default class Alova<S, E> {
  public options: AlovaOptions<S, E>;
  public id = `alova-${++idCounter}`;
  public storage: Storage;
  constructor(options: AlovaOptions<S, E>) {
    // 如果storage未指定，则默认使用localStorage
    this.storage = options.storage || window.localStorage;
    this.options = options;
  }
  Get<R, T = any>(url: string, config?: MethodConfig<R, T>) {
    return new Get<S, E, R, T>(this, url, config);
  }
  Post<R, T = any>(url: string, data: RequestBody = {}, config: MethodConfig<R, T> = {}) {
    return new Post<S, E, R, T>(this, url, data, config);
  }
  Delete<R, T = any>(url: string, data: RequestBody = {}, config: MethodConfig<R, T> = {}) {
    return new Delete<S, E, R, T>(this, url, data, config);
  }
  Put<R, T = any>(url: string, data: RequestBody = {}, config: MethodConfig<R, T> = {}) {
    return new Put<S, E, R, T>(this, url, data, config);
  }
  Head<R, T = any>(url: string, config: MethodConfig<R, T> = {}) {
    return new Head<S, E, R, T>(this, url, config);
  }
  Patch<R, T = any>(url: string, config: MethodConfig<R, T> = {}) {
    return new Patch<S, E, R, T>(this, url, config);
  }
  Options<R, T = any>(url: string, config: MethodConfig<R, T> = {}) {
    return new Options<S, E, R, T>(this, url, config);
  }
  Trace<R, T = any>(url: string, config: MethodConfig<R, T> = {}) {
    return new Trace<S, E, R, T>(this, url, config);
  }
}