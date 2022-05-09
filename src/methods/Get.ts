import { RequestState } from '../../typings';
import Method from './Method';

export default class Get<S extends RequestState> extends Method<S> {
  constructor(options: any) {
    super('Get');
  }
}