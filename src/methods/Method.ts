import { StatesHookCreator, StatesHookUpdater } from '../../typings';
import { Alova } from '../Alova';

export default class Method<C extends StatesHookCreator, U extends StatesHookUpdater> {
  private type: string;
  public context: Alova<C, U>;
  constructor(type: string) {
    this.type = type;
  }

  /**
   * @description 发送请求
   */
  async send() {
    console.log(this.type);
  }
}