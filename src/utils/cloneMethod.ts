import Method from '@/Method';
import { newInstance } from './helper';
import { getContext, ObjectCls } from './variables';

export default <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) => {
  const { data, config } = methodInstance,
    newConfig = { ...config },
    { headers = {}, params = {} } = newConfig,
    ctx = getContext(methodInstance);
  newConfig.headers = { ...headers };
  newConfig.params = { ...params };
  const newMethod = newInstance(
    Method<S, E, R, T, RC, RE, RH>,
    methodInstance.type,
    ctx,
    methodInstance.url,
    newConfig,
    data
  );

  ObjectCls.assign(newMethod, {
    ...methodInstance,
    config: newConfig
  });
  return newMethod;
};
