import Method from '@/Method';
import createRequestState from '@/functions/createRequestState';
import { objAssign } from '@alova/shared/function';
import { trueValue } from '@alova/shared/vars';
import { AlovaMethodHandler, EnumHookType, RequestHookConfig } from '~/typings';

export default function useRequest<
  State,
  Computed,
  Watched,
  Export,
  Responded,
  Transformed,
  RequestConfig,
  Response,
  ResponseHeader
>(
  handler:
    | Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
    | AlovaMethodHandler<
        State,
        Computed,
        Watched,
        Export,
        Responded,
        Transformed,
        RequestConfig,
        Response,
        ResponseHeader
      >,
  config: RequestHookConfig<
    State,
    Computed,
    Watched,
    Export,
    Responded,
    Transformed,
    RequestConfig,
    Response,
    ResponseHeader
  > = {}
) {
  const { immediate = trueValue, initialData } = config;
  const props = createRequestState(EnumHookType.USE_REQUEST, handler, config, initialData, !!immediate);
  const { send } = props;
  return objAssign(props, {
    send: (...args: any[]) => send(args)
  });
}
