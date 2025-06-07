import useRequest from '@/hooks/core/useRequest';
import { statesHookHelper } from '@/util/helper';
import { AlovaError, PromiseCls, createAssert, falseValue, newInstance, undefinedValue } from '@alova/shared';
import { AlovaGenerics, Method, promiseStatesHook } from 'alova';
import { AlovaMethodHandler, CaptchaHookConfig } from '~/typings/clienthook';

const hookPrefix = 'useCaptcha';
const captchaAssert: ReturnType<typeof createAssert> = createAssert(hookPrefix);
export default <AG extends AlovaGenerics, Args extends any[] = any[]>(
  handler: Method<AG> | AlovaMethodHandler<AG, Args>,
  config: CaptchaHookConfig<AG, Args> = {}
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

  const countdown = create(0, 'countdown');
  const requestReturned = useRequest(handler, {
    ...config,
    __referingObj: referingObject,
    immediate: falseValue,
    managedStates: objectify([countdown], 's'),
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    middleware: middleware ? (ctx, next) => middleware({ ...ctx, send }, next) : undefinedValue
  });

  const timer = ref(undefinedValue as NodeJS.Timeout | undefined);
  const send = (...args: [...Args, ...any[]]) =>
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
        reject(newInstance(AlovaError, hookPrefix, 'the countdown is not over yet'));
      }
    });
  return exposeProvider({
    ...requestReturned,
    send,
    ...objectify([countdown])
  });
};
