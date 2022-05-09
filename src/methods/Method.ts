import { RequestState } from '../../typings';
import { Alova } from '../Alova';

export default class Method<S extends RequestState> {
  private type: string;
  public context: Alova<S>;
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