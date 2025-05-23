import { axiosRequestAdapter } from '@/index';
import { createAlova } from 'alova';
import { Transform } from 'stream';

const baseURL = process.env.NODE_BASE_URL as string;
describe('requestAdapter', () => {
  test('should work with `stream` response type', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: axiosRequestAdapter(),
      responded({ data }) {
        return data;
      }
    });

    const Get = alovaInst.Get<any>('/unit-test', {
      responseType: 'stream'
    });
    const data = await Get;

    expect(data).toBeInstanceOf(Transform);
  });
});
