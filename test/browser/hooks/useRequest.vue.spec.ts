import expect from 'expect.js';
import {
  createAlova,
  VueHook,
  useRequest,
  GlobalFetch,
} from '../../../src';

function getInstance() {
  return createAlova({
    baseURL: 'http://localhost:3000',
    statesHook: VueHook,
    requestAdapter: GlobalFetch(),
    beforeRequest(config) {
      console.log(config);
      return config;
    },
    responsed(data) {
      console.log(123);
      return data.json();
    }
  });
}

describe('useRequet hook with vue', () => {
  it('init data', done => {
    const alova = getInstance();
    const Get = alova.Get<{str: number, name: string}, { SSS: string }>('/video/recommend', {
      params: { a: 1, b: 'str' },
      headers: {
        'Content-Type': 'application/json'
      },
      transformData(data, _) {
        console.log(data);
        return {
          str: 1,
          name: data.SSS,
        };
      },
      staleTime(s, b, m) {
        return 1000;
      },
    });
    const {
      data,
      onSuccess,
    } = useRequest(Get);
    onSuccess(() => {
      console.log(data);
      expect(1).to.equal(1);
      done();
    });
  });
});