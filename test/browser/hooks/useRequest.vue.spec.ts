import expect from 'expect.js';
import {
  createAlova,
  VueHook,
  useRequest,
  GlobalFetch,
} from '../../../src';
import { RequestConfig } from '../../../typings';
import { Result } from '../result.type';
import { exec } from 'child_process';

// 先启动测试服务，后续才可以调用
exec('npm run server');

function getInstance(
  beforeRequestExpect?: (config: RequestConfig<any, any>) => void,
  responseExpect?: (jsonPromise: Promise<any>) => void,
  resErrorExpect?: (err: Error) => void,
) {
  return createAlova({
    baseURL: 'http://localhost:3000',
    timeout: 5000,
    statesHook: VueHook,
    requestAdapter: GlobalFetch(),
    beforeRequest(config) {
      beforeRequestExpect && beforeRequestExpect(config);
      return config;
    },
    responsed: [response => {
      const jsonPromise = response.json();
      responseExpect && responseExpect(jsonPromise);
      return jsonPromise;
    }, err => {
      resErrorExpect && resErrorExpect(err);
    }]
  });
}

describe('useRequet hook with vue', function() {
  this.timeout(5000);
  it('init data and get', done => {
    const alova = getInstance(
      config => {
        expect(config.url).to.be('/unit-test');
        expect(config.params).to.eql({ a: 1, b: 'str' });
        expect(config.headers).to.eql({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).to.be(10000);
      },
      async jsonPromise => {
        const result = await jsonPromise;
        expect(result.data).to.be('Hello World Get');
      }
    );
    const Get = alova.Get<string, Result<string>>('/unit-test', {
      params: { a: 1, b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      transformData(result, _) {
        expect(result.code).to.be(200);
        expect(result.data).to.be('Hello World Get');
        return result.data;
      },
      staleTime: (result, headers, method) => {
        expect(result.code).to.be(200);
        expect(result.data).to.be('Hello World Get');
        expect(headers).an('object');
        expect(method).to.be('GET');
        return 100 * 1000;
      },
    });
    const {
      loading,
      data,
      progress,
      error,
      onSuccess,
    } = useRequest(Get);
    expect(loading.value).to.be(true);
    expect(data.value).to.be(null);
    expect(progress.value).to.be(0);
    expect(error.value).to.be(null);
    onSuccess(() => {
      expect(loading.value).to.be(false);
      expect(data.value).to.be('Hello World Get');
      expect(progress.value).to.be(0);
      expect(error.value).to.be(null);
      done();
    });
  });

  it('send get with request error', done => {
    const alova = getInstance(undefined, undefined, error => {
      console.log('error callback', error.message);
      expect(error.message).to.match(/Not Found/);
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-404');
    const {
      loading,
      data,
      progress,
      error,
      onError,
    } = useRequest(Get);
    expect(loading.value).to.be(true);
    expect(data.value).to.be(null);
    expect(progress.value).to.be(0);
    expect(error.value).to.be(null);
    onError(err => {
      expect(loading.value).to.be(false);
      expect(data.value).to.be(null);
      expect(progress.value).to.be(0);
      expect(error.value).an('object');
      expect(error.value).to.be(err);
      done();
    });
  });

  it.only('send get with responseCallback error', done => {
    const alova = getInstance(undefined, jsonPromise => {
      throw new Error('responseCallback error');
    }, error => {
      console.log('error callback', error.message);
      expect(error.message).to.match(/Not Found/);
    });
    const Get = alova.Get<string, Result<string>>('/unit-test');
    const {
      loading,
      data,
      progress,
      error,
      onError,
    } = useRequest(Get);
    expect(loading.value).to.be(true);
    expect(data.value).to.be(null);
    expect(progress.value).to.be(0);
    expect(error.value).to.be(null);
    onError(err => {
      expect(loading.value).to.be(false);
      expect(data.value).to.be(null);
      expect(progress.value).to.be(0);
      expect(error.value).an('object');
      expect(error.value).to.be(err);
      done();
    });
  });
});