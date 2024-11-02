import { Mock, MockRequestInit } from '~/typings';
import MockRequest from './MockRequest';

type MockWrapper = {
  enable: boolean;
  data: Mock;
};

/**
 * Create alova mock data request adapter
 * @param baseURL The simulated base URL, used for namespace use, is consistent with the baseURL parameter of the createAlova function.
 * @returns Create a mock definer
 */
export default function createAlovaMockAdapter<RequestConfig, Response, ResponseHeader>(
  mockWrapper: MockWrapper[],
  options: MockRequestInit<RequestConfig, Response, ResponseHeader> = { enable: true }
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
