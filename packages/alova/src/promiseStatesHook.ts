import { boundStatesHook } from '@/alova';
import myAssert from './utils/myAssert';

const promiseStatesHook = () => {
  myAssert(boundStatesHook, '`statesHook` is not set in alova instance');
  return boundStatesHook as NonNullable<typeof boundStatesHook>;
};

export default promiseStatesHook;
