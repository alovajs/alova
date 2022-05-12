import {
  createAlova,
  VueHook,
  useRequest
} from '../../../src';

const alova = createAlova({
  baseURL: '',
  statesHook: VueHook,
  // statesHook: ReactHook,
  requestAdapter(source, data, config) {
    return Promise.resolve(123);
  }
});
alova.setRequestInterceptor(config => {
  return config;
}).setResponseInterceptor(async response => {
  const dd = await response.json();
  return dd;
});
// alova.requestAdapter();

const Get = alova.Get<{str: number, name: string}>('', {
  
});
const dd = useRequest(Get);
dd.data.value.name;