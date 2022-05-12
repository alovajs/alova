import { MethodConfig, RequestState } from '../../typings';
import Alova, { Data } from '../Alova';
import requestAdapter from '../predefined/requestAdapter';
import { noop } from '../utils/helper';

export type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'TRACE';
export default class Method<S extends RequestState, E extends RequestState, R> {
  private type: MethodType;
  private url: string;
  public config: MethodConfig<R>;
  private data?: Data;
  public context: Alova<S, E>;
  public response: R;
  constructor(type: MethodType, url: string, data?: Data, config: MethodConfig<R> = {}) {
    this.type = type;
    this.url = url;
    this.config = config;
    this.data = data;
  }

  /**
   * @description 发送请求
   */
  send() {
    const { response } = this;
    if (response) {
      return Promise.resolve(response);
    }
    
    const {
      // beforeRequest = noop,
      // responsed = noop
    } = this.context.options;

    // 发送请求前调用钩子函数
    // const newConfig = beforeRequest({
    //   url: this.url,
    //   method: this.type,
    //   data: this.data,
    //   ...this.config,
    // });

    // 请求数据
    return requestAdapter('', '', {}).then((rawData: any) => {
      console.log(this.type, this.url, this.config, rawData);
      return rawData;
    });
  }

  /**
   * 获取请求方式的key值
   * @returns {string} 此请求方式的key值
   */
  key() {
    const {
      beforeRequest = noop,
    } = this.context.options;
    let config = {
      ...this.config,
      url: this.url,
      method: this.type,
      data: this.data,
    };
    config = beforeRequest(config) || config;
    return JSON.stringify([
      config.method,
      config.url,
      config.data,
      config.headers
    ]);
  }
}