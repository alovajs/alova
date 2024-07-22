import { Mock, MockWrapper } from '~/typings';

/**
 * 定义模拟数据
 * @param mock 模拟数据集合，可以是函数或者数据，如果是函数，它将接收一个包含了query、params、data三个属性的参数，分别表示查询参数、路径参数和请求体数据
 * @param enable 是否使用此模拟数据集合，默认为true
 */
export default (mock: Mock, enable = true): MockWrapper => ({
  enable,
  data: mock
});
