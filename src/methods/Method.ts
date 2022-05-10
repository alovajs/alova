import { RequestState } from '../../typings';
import { Alova } from '../Alova';

export default class Method<S extends RequestState, E extends RequestState, R> {
  private type: string;
  public context: Alova<S, E>;
  public response: R;
  constructor(type: string) {
    this.type = type;
  }

  /**
   * @description 发送请求
   */
  async send() {
    const { response } = this;
    if (response) {
      return response;
    }

    // 请求数据
    const rawData = await this.context.requestAdapter(1, 2, 3);
    console.log(this.type, rawData);
  }
}