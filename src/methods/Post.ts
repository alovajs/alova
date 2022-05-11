import { MethodConfig, RequestState } from '../../typings';
import { Data } from '../Alova';
import Method from './Method';

export default class Post<S extends RequestState, E extends RequestState, R> extends Method<S, E, R> {
  constructor(url: string, data: Data, config: MethodConfig<R>) {
    super('POST', url, config, data);
  }
}