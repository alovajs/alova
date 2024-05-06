import { buildErrorMsg, createAssert } from '@alova/shared/assert';
import { newInstance, statesHookHelper } from '@alova/shared/function';
import { PromiseCls, falseValue, trueValue, undefinedValue } from '@alova/shared/vars';
import { AlovaMethodHandler, Method, promiseStatesHook, useRequest } from 'alova';
import { CaptchaHookConfig } from '~/typings/general';

const hookPrefix = 'useCaptcha';
const captchaAssert = createAssert(hookPrefix);
export default <State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>(
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
  config: CaptchaHookConfig<State, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader> = {}
) => {
  const { initialCountdown, middleware } = config;
  captchaAssert(initialCountdown === undefinedValue || initialCountdown > 0, 'initialCountdown must be greater than 0');
  const {
    create,
    dehydrate,
    ref,
    exportObject,
    memorize,
    __referingObj: referingObject
  } = statesHookHelper(promiseStatesHook());

  const requestReturned = useRequest(handler, {
    ...config,
    __referingObj: referingObject,
    immediate: falseValue,
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    middleware: middleware ? (ctx, next) => middleware({ ...ctx, send }, next) : undefinedValue
  });

  const [countdown, setCountdown] = create(0, 'countdown', trueValue);

  const timer = ref(undefinedValue as NodeJS.Timeout | undefined);
  const send = memorize((...args: any[]) =>
    newInstance(PromiseCls, (resolve, reject) => {
      if (dehydrate(countdown) <= 0) {
        requestReturned
          .send(...args)
          .then(result => {
            setCountdown(config.initialCountdown || 60);
            timer.current = setInterval(() => {
              setCountdown(dehydrate(countdown) - 1);
              if (dehydrate(countdown) <= 0) {
                clearInterval(timer.current);
              }
            }, 1000);
            resolve(result);
          })
          .catch(reason => reject(reason));
      } else {
        reject(new Error(buildErrorMsg(hookPrefix, 'the countdown is not over yet')));
      }
    })
  );
  return {
    ...requestReturned,
    send,
    ...exportObject(
      {
        countdown
      },
      requestReturned
    )
  };
};
