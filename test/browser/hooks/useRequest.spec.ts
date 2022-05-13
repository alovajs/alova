import {
  createAlova,
  VueHook,
  useRequest,
  ReactHook
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
    return data.json();
    // return Promise.resolve('abc');
  }
});

const Get = alova.Get<{str: number, name: string}>('', {
  params: {},
  headers: {
    'Content-Type': 'application/json'
  },
  responsed(data: number, headers) {
    return data;
  }
});
const dd = useRequest(Get);
dd.data.value.str;