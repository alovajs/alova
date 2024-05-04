import { getContext, newInstance, objAssign } from '@alova/shared/function';
import Method from '@/Method';

export default <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) => {
  const { data, config } = methodInstance;
  const newConfig = { ...config };
  const { headers = {}, params = {} } = newConfig;
  const ctx = getContext(methodInstance);
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
  return objAssign(newMethod, {
    ...methodInstance,
    config: newConfig
  });
};
