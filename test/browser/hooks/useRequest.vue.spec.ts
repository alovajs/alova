import expect from 'expect.js';
import {
  createAlova,
  VueHook,
  useRequest,
  GlobalFetch,
} from '../../../src';
import { RequestConfig } from '../../../typings';

function getInstance(
  beforeRequestExpect: (config: RequestConfig<any, any>) => void,
  responseExpect: (response: Response) => void,
) {
  return createAlova({
    baseURL: 'http://localhost:3000',
    timeout: 5000,
    statesHook: VueHook,
    requestAdapter: GlobalFetch(),
    beforeRequest(config) {
      beforeRequestExpect(config);
      return config;
    },
    responsed(data) {
      responseExpect(data);
      return data.json();
    }
  });
}

describe('useRequet hook with vue', () => {
  it.only('init data', done => {
    const alova = getInstance(
      config => {
        expect(config.url).to.be('/video/recommend');
        // expect(config.params).to.equal({ a: 1, b: 'str' });
        expect(config.params).to.eql({ a: 1, b: 'str' });
        expect(config.headers).to.eql({
          'Content-Type': 'application/json'
        });
      },
      response => {
        expect(response.status).to.be(200);
        // expect(response.json())(200);
      }
    );

    const Get = alova.Get<{str: string, code: number}>('/video/recommend', {
      params: { a: 1, b: 'str' },
      headers: {
        'Content-Type': 'application/json'
      },
      transformData(data, _) {
        return {
          str: 'string',
          code: data.code,
        };
      },
      staleTime: (s, b, m) => 1000000,
    });
    const {
      data,
      onSuccess,
    } = useRequest(Get);
    onSuccess(() => {
      console.log('success', data.value);
      expect(1).to.equal(1);
      done();
    });
  });
});