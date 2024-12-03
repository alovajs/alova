import { uniappMockResponse, uniappRequestAdapter } from '@alova/adapter-uniapp';
import { createAlovaMockAdapter, defineMock } from '@alova/mock';

const mocks = defineMock({
  '[GET]/detail': () => {
    return {
      code: 200,
      data: {
        id: 1
      },
      message: 'success'
    };
  }
});

// 模拟数据请求适配器
export default createAlovaMockAdapter([mocks], {
  delay: 1000,
  httpAdapter: uniappRequestAdapter,
  onMockResponse: uniappMockResponse,
  mockRequestLogger: false
});