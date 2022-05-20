import expect from 'expect.js';
import {
  createAlova,
  VueHook,
  useRequest,
  GlobalFetch,
} from '../../../src';


function getInstance() {
  return createAlova({
    baseURL: '',
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

const baseURL = 'http://localhost:5000';
describe('useRequet hook with vue', () => {
  it('init data', () => {
    const alova = getInstance();
    const Get = alova.Get<{str: number, name: string}, { SSS: string }>(baseURL, {
      params: { a: 1, b: 'str' },
      headers: {
        'Content-Type': 'application/json'
      },
      transformData(data, _) {
        return {
          str: 1,
          name: data.SSS,
        };
      },
      staleTime(s, b, m) {
        return 1000;
      },
    });
    const states = useRequest(Get);
    console.log(states);
    expect(1).to.equal(1);
  });
});