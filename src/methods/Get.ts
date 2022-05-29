import { MethodConfig } from '../../typings';
import Alova from '../Alova';
import Method from './Method';

export default class Get<S, E, R, T> extends Method<S, E, R, T> {
  constructor(context: Alova<S, E>, url: string, config?: MethodConfig<R, T>) {
    super('GET', context, url, config);
  }
}