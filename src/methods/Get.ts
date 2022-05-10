import { RequestState } from '../../typings';
import Method from './Method';

export default class Get<S extends RequestState, E extends RequestState, R> extends Method<S, E, R> {
  constructor(options: any) {
    super('Get');
  }
}