import { objAssign } from '@alova/shared/function';
import { trueValue } from '@alova/shared/vars';
import { AlovaGenerics, Method } from 'alova';
import { AlovaMethodHandler, EnumHookType, RequestHookConfig } from '~/typings';
import createRequestState from './implements/createRequestState';

/**
 * 自动管理响应状态hook
 * @example
 * ```js
 * const { loading, data, error, send, onSuccess } = useRequest(alova.Get('/api/user'))
 * ```
 * @param methodHandler method实例或获取函数
 * @param config 配置项
 * @returns 响应式请求数据、操作函数及事件绑定函数
 */
export default function useRequest<AG extends AlovaGenerics>(
  handler: Method<AG> | AlovaMethodHandler<AG>,
  config: RequestHookConfig<AG> = {}
) {
  const { immediate = trueValue, initialData } = config;
  const props = createRequestState(EnumHookType.USE_REQUEST, handler, config, initialData, !!immediate);
  const { send } = props;
  return objAssign(props, {
    send: (...args: any[]) => send(args)
  });
}
