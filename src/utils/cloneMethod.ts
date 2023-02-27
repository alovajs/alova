import Method from '../Method';
import { isFormData, newInstance } from './helper';
import { getContext } from './variables';

export default <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) => {
  const { data, config } = methodInstance;
  const newConfig = { ...config };
  const { headers = {}, params = {} } = newConfig;
  newConfig.headers = { ...headers };
  newConfig.params = { ...params };
  let newData = data;
  if (isFormData(data)) {
    // 拷贝FormData
    newData = newInstance(FormData);
    (data as FormData).forEach((value, name) => {
      (newData as FormData).append(name.toString(), value);
    });
  }
  const clonedMethod = newInstance(
    Method<S, E, R, T, RC, RE, RH>,
    methodInstance.type,
    getContext(methodInstance),
    methodInstance.url,
    newConfig,
    newData
  );
  return clonedMethod;
};
