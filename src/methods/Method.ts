import { MethodConfig, RequestState } from '../../typings';
import Alova, { Data } from '../Alova';

export type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'TRACE';
export default class Method<S extends RequestState, E extends RequestState, R> {
  private type: MethodType;
  private url: string;
  private config: MethodConfig<R>;
  private data?: Data;
  public context: Alova<S, E>;
  public response: R;
  constructor(type: MethodType, url: string, config: MethodConfig<R>, data?: Data) {
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
      return response;
    }
    
    const {
      options,
      // reqInter,
      // resInter,
    } = this.context;
    const {
      requestAdapter,
    } = options;

    // 请求数据
    return requestAdapter(1, 2, 3).then((rawData: any) => {
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
      reqInter,
    } = this.context;
    let config = {
      ...this.config,
      url: this.url,
      method: this.type,
      data: this.data,
    };
    config = reqInter(config) || config;
    return JSON.stringify([
      config.method,
      config.url,
      config.data,
      config.headers
    ]);
  }
}