import { MethodConfig, RequestState } from '../../typings';
import Method from './Method';

export default class Options<S extends RequestState, E extends RequestState, R, T> extends Method<S, E, R, T> {
  constructor(url: string, config: MethodConfig<R, T>) {
    super('OPTIONS', url, config);
  }
}