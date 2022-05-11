import {
  createAlova,
  VueHook,
  useRequest
} from '../../../src';

const alova = createAlova({
  baseURL: '',
  statesHook: VueHook,
  // statesHook: ReactHook,
});
alova.setRequestInterceptor(config => {
  // config.
  return config;
}).setResponseInterceptor(async response => {
  const dd = await response.json();
  return dd;
});


const Get = alova.Get<{str: number, name: string}>('', {});
const dd = useRequest(Get);
dd.data.value.name;