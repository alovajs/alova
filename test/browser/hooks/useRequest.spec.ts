import {
  createAlova,
  VueHook,
  useRequest
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
// .setResponseInterceptor(async response => {
//   const dd = await response.json();
//   return dd;
// });
// alova.requestAdapter();

const Get = alova.Get<{str: number, name: string}>('', {
  params: {},
  headers: {
    'Content-Type': 'application/json'
  },
  transformResponse(data, headers) {
    return '';
  }
});
const dd = useRequest(Get);
dd.data.value.str;