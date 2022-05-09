import { StatesHookCreator, StatesHookUpdater } from '../../typings';
import Method from './Method';

export default class Get<C extends StatesHookCreator, U extends StatesHookUpdater> extends Method<C, U> {
  constructor(options: any) {
    super('Get');
  }
}