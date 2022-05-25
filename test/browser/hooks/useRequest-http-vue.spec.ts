import expect from 'expect.js';
import {
  createAlova,
  VueHook,
  useRequest,
  GlobalFetch,
} from '../../../src';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { RequestConfig } from '../../../typings';
import { GetData, PostData, Result } from '../result.type';
// import { exec } from 'child_process';


// 先启动测试服务，后续才可以调用
// exec('npm run server');

function getInstance(
  beforeRequestExpect?: (config: RequestConfig<any, any>) => void,
  responseExpect?: (jsonPromise: Promise<any>) => void,
  resErrorExpect?: (err: Error) => void,
) {
  return createAlova({
    baseURL: 'http://localhost:3000',
    timeout: 3000,
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

describe('use useRequet hook to send GET with vue', function() {
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
        expect(result.data.path).to.be('/unit-test');
        expect(result.data.params).to.eql({ a: 1, b: 'str' });
      }
    );
    const Get = alova.Get<GetData, Result>('/unit-test', {
      params: { a: 1, b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData(result, _) {
        expect(result.code).to.be(200);
        expect(result.data.path).to.be('/unit-test');
        expect(result.data.params).to.eql({ a: 1, b: 'str' });
        return result.data;
      },
      staleTime: (result, headers, method) => {
        expect(result.code).to.be(200);
        expect(result.data.path).to.be('/unit-test');
        expect(result.data.params).to.eql({ a: 1, b: 'str' });
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
      try {
        expect(loading.value).to.be(false);
        expect(data.value.path).to.be('/unit-test');
        expect(data.value.params).to.eql({ a: 1, b: 'str' });
        expect(progress.value).to.be(0);
        expect(error.value).to.be(null);

        // 缓存有值
        const cacheData = getResponseCache('http://localhost:3000', key(Get));
        expect(cacheData.path).to.be('/unit-test');
        expect(cacheData.params).to.eql({ a: 1, b: 'str' });
      } catch (error) {}
      done();
    });
  });

  it('send get with request error', done => {
    const alova = getInstance(undefined, undefined, error => {
      console.log('error callback', error.message);
      expect(error.message).to.match(/Not Found/);
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-404', {
      staleTime: 100000
    });
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

      // 请求错误无缓存
      const cacheData = getResponseCache('http://localhost:3000', key(Get));
      expect(cacheData).to.be(undefined);
      done();
    });
  });

  it('send get with responseCallback error', done => {
    const alova = getInstance(undefined, jsonPromise => {
      throw new Error('responseCallback error');
    }, error => {
      console.log('error responseCallback', error.message);
      expect(error.message).to.match(/responseCallback error/);
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

  it('abort request when timeout', done => {
    const alova = getInstance(undefined, undefined, error => {
      console.log('error timeout', error.message);
      expect(error.message).to.match(/network timeout/);
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-10s', {  timeout: 500 });
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

  it('manual abort request', done => {
    const alova = getInstance(undefined, undefined, error => {
      console.log('manual abort', error.message);
      expect(error.message).to.match(/user aborted a request/);
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-10s');
    const {
      loading,
      data,
      progress,
      error,
      onError,
      abort
    } = useRequest(Get);
    expect(loading.value).to.be(true);
    expect(data.value).to.be(null);
    expect(progress.value).to.be(0);
    expect(error.value).to.be(null);
    setTimeout(abort, 100);
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


// 其他请求方式测试
describe('Test other methods without GET', function() {
  it.only('send POST', done => {
    const alova = getInstance(
      config => {
        expect(config.url).to.be('/unit-test');
        expect(config.params).to.eql({ a: 1, b: 'str' });
        expect(config.data).to.eql({ post1: 'a' });
        config.data.post2 = 'b';
        expect(config.headers).to.eql({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).to.be(10000);
      },
      async jsonPromise => {
        const { data } = await jsonPromise;
        expect(data.path).to.be('/unit-test');
        expect(data.data).to.eql({ post1: 'a', post2: 'b' });
        expect(data.params).to.eql({ a: 1, b: 'str' });
      }
    );
    const Get = alova.Post<PostData, Result<true>>('/unit-test', { post1: 'a' }, {
      params: { a: 1, b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData({ code, data }, _) {
        expect(code).to.be(200);
        expect(data.path).to.be('/unit-test');
        expect(data.params).to.eql({ a: 1, b: 'str' });
        expect(data.data).to.eql({ post1: 'a', post2: 'b' });
        return data;
      },
      staleTime: ({ code, data }, headers, method) => {
        expect(code).to.be(200);
        expect(data.path).to.be('/unit-test');
        expect(data.params).to.eql({ a: 1, b: 'str' });
        expect(data.data).to.eql({ post1: 'a', post2: 'b' });
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
      try {
        expect(loading.value).to.be(false);
        expect(data.value.path).to.be('/unit-test');
        expect(data.value.params).to.eql({ a: 1, b: 'str' });
        expect(data.value.data).to.eql({ post1: 'a', post2: 'b' });
        expect(progress.value).to.be(0);
        expect(error.value).to.be(null);

        // 缓存有值
        const cacheData = getResponseCache('http://localhost:3000', key(Get));
        expect(cacheData).to.be(undefined);
      } catch (error) {}
      done();
    });
  });
});