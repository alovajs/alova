import { accessAction, actionDelegationMiddleware, useCaptcha } from '@/index';
import { createAlova } from 'alova';
import VueHook from 'alova/vue';
import { untilCbCalled } from 'root/testUtils';
import { mockRequestAdapter } from '~/test/mockData';

const alovaInst = createAlova({
  baseURL: 'http://localhost:8080',
  statesHook: VueHook,
  requestAdapter: mockRequestAdapter,
  cacheLogger: false
});
describe('vue => useCaptcha', () => {
  test('should throw error when initialCountdown is less than 0', () => {
    const poster = alovaInst.Post('/captcha');
    expect(() => {
      useCaptcha(poster, {
        initialCountdown: -1
      });
    }).toThrow();
    expect(() => {
      useCaptcha(poster, {
        initialCountdown: 0
      });
    }).toThrow();
  });

  test('allow send captcha when countdown is 0', async () => {
    const poster = () => alovaInst.Post('/captcha');
    const { loading, countdown, data, send } = useCaptcha(poster, {
      initialCountdown: 5
    });

    // 默认不发送请求
    expect(loading.value).toBeFalsy();
    expect(countdown.value).toBe(0);
    expect(data.value).toBeUndefined();

    const setTimeoutFn = setTimeout;
    jest.useFakeTimers();
    const promise = send();
    expect(loading.value).toBeTruthy();
    expect(countdown.value).toBe(0);

    await untilCbCalled(setTimeoutFn, 10); // 使用备份的setTimeout来延迟
    jest.runAllTimers();
    await promise;
    expect(countdown.value).toBe(5);
    await expect(send()).rejects.toThrow(/the countdown is not over yet/);
    jest.advanceTimersByTime(1000);
    expect(countdown.value).toBe(4);

    jest.advanceTimersByTime(1000);
    expect(countdown.value).toBe(3);

    jest.advanceTimersByTime(3000);
    expect(countdown.value).toBe(0);

    // 倒计时完成了，即使再过段时间倒计时也还是停留在0
    jest.advanceTimersByTime(3000);
    expect(countdown.value).toBe(0);
    jest.useRealTimers();
  });

  test("shouldn't start countdown when request error", async () => {
    const poster = alovaInst.Post('/captcha', { error: 1 });
    const { countdown, send } = useCaptcha(poster, {
      initialCountdown: 5
    });
    await expect(send()).rejects.toThrow('server error');
    expect(countdown.value).toBe(0);
  });

  test('initialCountdown default value is 60', async () => {
    const poster = alovaInst.Post('/captcha');
    const { countdown, send } = useCaptcha(poster);
    await send();
    expect(countdown.value).toBe(60);
  });

  test('should access actions by middleware actionDelegation', async () => {
    const poster = alovaInst.Post('/captcha');
    const { send, onComplete, onSuccess } = useCaptcha(poster, {
      initialCountdown: 5,
      middleware: actionDelegationMiddleware('test_page')
    });

    const successFn = jest.fn();
    const completeFn = jest.fn();
    onSuccess(successFn);
    onComplete(completeFn);

    const setTimeoutFn = setTimeout;
    jest.useFakeTimers();
    let promise = send();
    await untilCbCalled(setTimeoutFn, 10); // 使用备份的setTimeout来延迟
    jest.runOnlyPendingTimers();
    await promise;

    expect(successFn).toHaveBeenCalledTimes(1);
    expect(completeFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(6000); // 让倒计时完成
    accessAction('test_page', handlers => {
      expect(handlers.send).toBeInstanceOf(Function);
      expect(handlers.abort).toBeInstanceOf(Function);
      promise = handlers.send();
    });

    await untilCbCalled(setTimeoutFn, 10);
    jest.runOnlyPendingTimers();
    await promise;
    expect(successFn).toHaveBeenCalledTimes(2);
    expect(completeFn).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});
