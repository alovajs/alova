import {
  createAlova,
  VueHook,
  useRequest,
  ReactHook,
  useManual
} from '../../../src';

const alova = createAlova({
  baseURL: '',
  statesHook: VueHook,
  // statesHook: ReactHook,
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

const Get = alova.Get<{str: number, name: string}, { SSS: string }>('', {
  params: {},
  headers: {
    'Content-Type': 'application/json'
  },
  responsed(data, headers) {
    return data;
  },
  staleTime(s, b, m) {
    return 1;
  }
});
const dd = useRequest(Get);
dd.data.value.str;

const mm = useManual(Get);
mm.run();