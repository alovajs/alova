import { MethodConfig, RequestState } from '../../typings';
import Method from './Method';

export default class Head<S extends RequestState, E extends RequestState, R, T> extends Method<S, E, R, T> {
  constructor(url: string, config: MethodConfig<R, T>) {
    super('HEAD', url, config);
  }
}