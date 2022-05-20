import expect from 'expect.js';
import {
  createAlova,
  VueHook,
  useWatcher,
  GlobalFetch,
} from '../../../src';


function getInstance() {
  return createAlova({
    baseURL: '',
    statesHook: VueHook,
    requestAdapter: GlobalFetch(),
    beforeRequest(config) {
      config.url
      config.data
      config.body
      config.credentials
      return config;
    },
    responsed(data) {
      console.log(123);
      return data.json();
      // return Promise.resolve('abc');
    }
  });
}

const baseURL = 'http://localhost:5000';
describe('Match efficiency test', () => {
  it('init get data', () => {
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
      }
    });
    const ww = useWatcher(() => Get, [], {
      effect: true
    });
    console.log(ww);
    expect(1).to.equal(2);
  });
});