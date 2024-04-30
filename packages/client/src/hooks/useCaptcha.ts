import { T$, Tupd$, TuseFlag$, TuseMemorizedCallback$, T_$, T_exp$ } from '@/framework/type';
import { buildErrorMsg, createAssert, newInstance } from '@/helper';
import { falseValue, PromiseCls, trueValue, undefinedValue } from '@/helper/variables';
import { AlovaMethodHandler, Method, useRequest } from 'alova';
import { CaptchaHookConfig } from '~/typings/general';

const hookPrefix = 'useCaptcha';
const captchaAssert = createAssert(hookPrefix);
export default <S, E, R, T, RC, RE, RH>(
  handler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
  config: CaptchaHookConfig<S, E, R, T, RC, RE, RH>,
  $: T$,
  upd$: Tupd$,
  _$: T_$,
  _exp$: T_exp$,
  useFlag$: TuseFlag$,
  useMemorizedCallback$: TuseMemorizedCallback$
) => {
  const { initialCountdown, middleware } = config;
  captchaAssert(initialCountdown === undefinedValue || initialCountdown > 0, 'initialCountdown must be greater than 0');

  const countdown = $(0, trueValue);
  const requestReturned = useRequest(handler, {
    ...config,
    immediate: falseValue,
    middleware: middleware ? (ctx, next) => middleware({ ...ctx, send }, next) : undefinedValue
  });

  const timer = useFlag$(undefinedValue as NodeJS.Timeout | undefined);
  const send = useMemorizedCallback$((...args: any[]) =>
    newInstance(PromiseCls, (resolve, reject) => {
      if (_$(countdown) <= 0) {
        requestReturned
          .send(...args)
          .then(result => {
            upd$(countdown, config.initialCountdown || 60);
            timer.current = setInterval(() => {
              upd$(countdown, val => val - 1);
              if (_$(countdown) <= 0) {
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
    countdown: _exp$(countdown)
  };
};
