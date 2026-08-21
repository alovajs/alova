import { throttle } from '@/util/helper';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('throttle', () => {
  test('first call fires immediately (no leading delay)', () => {
    const fn = vi.fn();
    const th = throttle(fn, 100);
    th(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(1);
  });

  test('wait <= 0 disables throttling (passthrough)', () => {
    const fn = vi.fn();
    const th = throttle(fn, 0);
    th(1);
    th(2);
    th(3);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test('middle calls are throttled but the LAST (tail) frame always fires', async () => {
    const fn = vi.fn();
    const th = throttle(fn, 100);
    th('a'); // immediate
    expect(fn).toHaveBeenCalledTimes(1);
    th('b');
    th('c');
    expect(fn).toHaveBeenCalledTimes(1); // still throttled, tail buffered
    await delay(120);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('c'); // guaranteed tail frame
  });

  test('the final 100% progress frame is never swallowed', async () => {
    const fn = vi.fn();
    const th = throttle(fn, 100);
    th(0);
    th(50);
    th(100); // final value
    expect(fn).toHaveBeenCalledTimes(1);
    await delay(120);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(100);
  });

  test('each window flushes its own tail frame', async () => {
    const fn = vi.fn();
    const th = throttle(fn, 100);
    th(1);
    th(2);
    await delay(120);
    expect(fn).toHaveBeenLastCalledWith(2);
    expect(fn).toHaveBeenCalledTimes(2);
    th(3);
    th(4);
    await delay(120);
    expect(fn).toHaveBeenLastCalledWith(4);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
