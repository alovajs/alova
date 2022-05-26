import expect from 'expect.js';
import React from 'react';
import {
  createAlova,
  ReactHook,
  useRequest,
  GlobalFetch,
} from '../../../src';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { RequestConfig } from '../../../typings';
import { GetData, Result } from '../result.type';

import server from '../../server';
import { after, before, afterEach } from 'mocha';


function getInstance(
  beforeRequestExpect?: (config: RequestConfig<any, any>) => void,
  responseExpect?: (jsonPromise: Promise<any>) => void,
  resErrorExpect?: (err: Error) => void,
) {
  return createAlova({
    baseURL: 'http://localhost:3000',
    timeout: 3000,
    statesHook: ReactHook,
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

before(() => server.listen());
afterEach(() => server.resetHandlers());
after(() => server.close());
describe('useRequet hook with react', function() {
  this.timeout(5000);
  it.only('send GET', done => {
    const alova = getInstance(
      config => {
        expect(config.url).to.be('/unit-test');
        expect(config.params).to.eql({ a: 1, b: 'str' });
        if (config.params) {
          config.params.c = 'c';
        }
        expect(config.headers).to.eql({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).to.be(10000);
      },
      async jsonPromise => {
        const { data } = await jsonPromise;
        expect(data.path).to.be('/unit-test');
        expect(data.params).to.eql({ a: 1, b: 'str', c: 'c' });
      }
    );
    const Get = alova.Get<GetData, Result<true>>('/unit-test', {
      params: { a: 1, b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData({ code, data }, _) {
        expect(code).to.be(200);
        expect(data.path).to.be('/unit-test');
        expect(data.params).to.eql({ a: 1, b: 'str', c: 'c' });
        return data;
      },
      staleTime: ({ code, data }, headers, method) => {
        expect(code).to.be(200);
        expect(data.path).to.be('/unit-test');
        expect(data.params).to.eql({ a: 1, b: 'str', c: 'c' });
        expect(headers).an('object');
        expect(method).to.be('GET');
        return 100 * 1000;
      },
    });

    function App() {
      const {
        loading,
        data,
        progress,
        error,
        onSuccess,
      } = useRequest(Get);
      expect(loading).to.be(true);
      expect(data).to.be(null);
      expect(progress).to.be(0);
      expect(error).to.be(null);
      onSuccess(() => {
        try {
          expect(loading).to.be(false);
          expect(data.path).to.be('/unit-test');
          expect(data.params).to.eql({ a: 1, b: 'str' });
          expect(progress).to.be(0);
          expect(error).to.be(null);
  
          // 缓存有值
          const cacheData = getResponseCache('http://localhost:3000', key(Get));
          expect(cacheData.path).to.be('/unit-test');
          expect(cacheData.params).to.eql({ a: 1, b: 'str', c: 'c' });
        } catch (error) {}
        done();
      });
      return React.createElement('div', null, data.toString());
    }
    // const root = document.createElement('div');
    // ReactDOM.render(App(), document.body);
    console.log(document.body);
  });
});