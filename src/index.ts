import createAlova from './Alova';
import useRequest from './hooks/useRequest';
import ReactHook from './predefined/ReactHook';
import VueHook from './predefined/VueHook';

// export { default as useRequest } from './hooks/useRequest';

const alova = createAlova({
  baseURL: '',
  // statesHook: VueHook,
  statesHook: ReactHook,
});

const Get = alova.Get<{num: number}>('', {});
const dd = useRequest(Get);
dd.