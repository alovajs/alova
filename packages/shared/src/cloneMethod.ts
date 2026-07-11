import { getContext, isString, newInstance, objAssign } from './function';

/**
 * Clone a method instance deeply so that the global `beforeRequest` hook can
 * mutate it without affecting the original instance. This avoids side effects
 * when the same method is sent/connected multiple times.
 *
 * The `Method` constructor must be passed in because `@alova/shared` cannot
 * depend on the `alova` package (that would create a circular dependency), and
 * method subclasses such as `HookedMethod`/`LimitedMethod` have their own
 * constructors that must not be instantiated here.
 */
export default <T, C extends { new (...args: any[]): T }>(methodInstance: T, MethodCls: C): T => {
  const { data, config } = methodInstance as any;
  const newConfig = { ...config };
  const { headers = {}, params = {} } = newConfig;
  const ctx = getContext(methodInstance as any);
  newConfig.headers = { ...headers };
  newConfig.params = isString(params) ? params : { ...params };
  const newMethod = newInstance(
    MethodCls as any,
    (methodInstance as any).type,
    ctx,
    (methodInstance as any).url,
    newConfig,
    data
  );
  return objAssign(
    newMethod as Record<string, any>,
    {
      ...(methodInstance as any),
      config: newConfig
    } as Record<string, any>
  ) as T;
};
