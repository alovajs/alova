import {
  createAlova,
  VueHook,
  useRequest,
  ReactHook,
  useController,
  useWatcher,
  GlobalFetch,
} from '../../../src';

const alova = createAlova({
  baseURL: '',
  statesHook: VueHook,
  requestAdapter: GlobalFetch(),
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
  transformData(data, _) {
    return {
      str: 1,
      name: data.SSS,
    };
  },
  staleTime(s, b, m) {
    return 1;
  }
});
const dd = useRequest(Get);
dd.data.value.str;

const mm = useController(Get);
mm.send();

const ww = useWatcher(() => Get, [], {
  effect: true
});
ww.progress.value;