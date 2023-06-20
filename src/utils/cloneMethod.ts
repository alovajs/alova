import Method from '@/Method';
import { newInstance } from './helper';
import { getContext } from './variables';

export default <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) => {
  const { data, config } = methodInstance,
    newConfig = { ...config },
    { headers = {}, params = {} } = newConfig;
  newConfig.headers = { ...headers };
  newConfig.params = { ...params };
  return newInstance(
    Method<S, E, R, T, RC, RE, RH>,
    methodInstance.type,
    getContext(methodInstance),
    methodInstance.url,
    newConfig,
    data
  );
};
