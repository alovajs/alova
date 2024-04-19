import { Mock, MockRequestInit } from '../typings';
import MockRequest from './MockRequest';

type MockWrapper = {
  enable: boolean;
  data: Mock;
};

/**
 * 创建alova模拟数据请求适配器
 * @param baseURL 模拟的基础url，用于命名空间使用，与createAlova函数的baseURL参数保持一致
 * @returns 创建一个模拟定义器
 */
export default function createAlovaMockAdapter<RC, RE, RH>(
  mockWrapper: MockWrapper[],
  options: MockRequestInit<any, any, RC, RE, RH> = { enable: true }
) {
  let uniqueMockMap: Mock = {};
  mockWrapper
    .filter(({ enable }) => enable)
    .forEach(({ data }) => {
      uniqueMockMap = {
        ...data,
        ...uniqueMockMap
      };
    });
  return MockRequest({
    ...options,
    mock: uniqueMockMap
  });
}
