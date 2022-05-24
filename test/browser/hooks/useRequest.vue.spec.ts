import expect from 'expect.js';
import {
  createAlova,
  VueHook,
  useRequest,
  GlobalFetch,
} from '../../../src';
import { RequestConfig } from '../../../typings';
import { Result } from '../result.type';
// import { exec } from 'child_process';

// 先启动测试服务，后续才可以调用
// exec('npm run server');

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

describe('useRequet hook with vue', function() {
  it.only('init data and get', done => {
    const alova = getInstance(
      config => {
        expect(config.url).to.be('/unit-test');
        // expect(config.params).to.equal({ a: 1, b: 'str' });
        expect(config.params).to.eql({ a: 1, b: 'str' });
        expect(config.headers).to.eql({
          'Content-Type': 'application/json'
        });
      },
      async response => {
        expect(response.status).to.be(200);
        const result = await response.json();
        console.log(result);
        expect(result.data).to.be('Hello World Get');
      }
    );

    const Get = alova.Get<string, Result<string>>('/unit-test', {
      params: { a: 1, b: 'str' },
      headers: {
        'Content-Type': 'application/json'
      },
      transformData(data, _) {
        return data.data;
      },
      staleTime: (s, b, m) => {
        console.log('staleTime', s, b, m);
        return 100 * 1000;
      },
    });
    const {
      data,
      onSuccess,
    } = useRequest(Get);
    onSuccess(() => {
      console.log('success', data.value);
      expect(data.value).to.be('Hello World Get');
      done();
    });
  });
});