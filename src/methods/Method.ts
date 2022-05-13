import { MethodConfig, MethodType, RequestState } from '../../typings';
import Alova, { RequestBody } from '../Alova';

export default class Method<S extends RequestState, E extends RequestState, R, T> {
  public type: MethodType;
  public url: string;
  public config: MethodConfig<R, T>;
  public requestBody?: RequestBody;
  public context: Alova<S, E>;
  public response: R;
  constructor(type: MethodType, url: string, config: MethodConfig<R, T> = {}, requestBody?: RequestBody) {
    this.type = type;
    this.url = url;
    this.config = config;
    this.requestBody = requestBody;
  }
}