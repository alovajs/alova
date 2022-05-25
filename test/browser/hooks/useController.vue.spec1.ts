import expect from 'expect.js';
import {
  createAlova,
  VueHook,
  useController,
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

describe('Match efficiency test', () => {
  it('init2 data', () => {
    const alova = getInstance();
    const Get = alova.Get<{str: number, name: string}, { SSS: string }>('', {
      params: {},
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
    const mm = useController(Get);
    mm.send();
    expect(1).to.equal(1);
  });
});