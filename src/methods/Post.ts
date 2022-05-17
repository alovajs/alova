import { MethodConfig, RequestState } from '../../typings';
import Alova, { RequestBody } from '../Alova';
import Method from './Method';

export default class Post<S extends RequestState, E extends RequestState, R, T> extends Method<S, E, R, T> {
  constructor(context: Alova<S, E>, url: string, requestBody: RequestBody, config: MethodConfig<R, T>) {
    super('POST', context, url, config, requestBody);
  }
}