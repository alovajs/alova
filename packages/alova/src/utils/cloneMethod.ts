import Method from '@/Method';
import { getContext, newInstance, objAssign } from '@alova/shared/function';

export default <State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>(
  methodInstance: Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
) => {
  const { data, config } = methodInstance;
  const newConfig = { ...config };
  const { headers = {}, params = {} } = newConfig;
  const ctx = getContext(methodInstance);
  newConfig.headers = { ...headers };
  newConfig.params = { ...params };
  const newMethod = newInstance(
    Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>,
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
