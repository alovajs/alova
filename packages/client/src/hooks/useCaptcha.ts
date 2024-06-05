import useRequest from '@/hooks/core/useRequest';
import { buildErrorMsg, createAssert } from '@alova/shared/assert';
import { newInstance, statesHookHelper } from '@alova/shared/function';
import { PromiseCls, falseValue, trueValue, undefinedValue } from '@alova/shared/vars';
import { AlovaGenerics, Method, promiseStatesHook } from 'alova';
import { AlovaMethodHandler } from '~/typings';
import { CaptchaHookConfig } from '~/typings/general';

const hookPrefix = 'useCaptcha';
const captchaAssert = createAssert(hookPrefix);
export default <AG extends AlovaGenerics>(
  handler: Method<AG> | AlovaMethodHandler<AG>,
  config: CaptchaHookConfig<AG> = {}
) => {
  const { initialCountdown, middleware } = config;
  captchaAssert(initialCountdown === undefinedValue || initialCountdown > 0, 'initialCountdown must be greater than 0');
  const {
    create,
    ref,
    objectify,
    exposeProvider,
    __referingObj: referingObject
  } = statesHookHelper(promiseStatesHook());

  const requestReturned = useRequest(handler, {
    ...config,
    __referingObj: referingObject,
    immediate: falseValue,
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    middleware: middleware ? (ctx, next) => middleware({ ...ctx, send }, next) : undefinedValue
  });

  const countdown = create(0, 'countdown', trueValue);

  const timer = ref(undefinedValue as NodeJS.Timeout | undefined);
  const send = (...args: any[]) =>
    newInstance(PromiseCls, (resolve, reject) => {
      if (countdown.v <= 0) {
        requestReturned
          .send(...args)
          .then(result => {
            countdown.v = config.initialCountdown || 60;
            timer.current = setInterval(() => {
              countdown.v -= 1;
              if (countdown.v <= 0) {
                clearInterval(timer.current);
              }
            }, 1000);
            resolve(result);
          })
          .catch(reason => reject(reason));
      } else {
        reject(new Error(buildErrorMsg(hookPrefix, 'the countdown is not over yet')));
      }
    });
  return exposeProvider({
    ...requestReturned,
    send,
    ...objectify([countdown])
  });
};
