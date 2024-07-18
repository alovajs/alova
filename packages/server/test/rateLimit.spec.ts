import createRateLimiter from '@/hooks/rateLimit';
import { createAlovaMockAdapter, defineMock } from '@alova/mock';
import { createAlova } from 'alova';
import GlobalFetch from 'alova/fetch';
import VueHook from 'alova/vue';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

interface MockResponse {
  code: number;
  msg: string;
  data: any;
}

const mocks = defineMock({
  '/return-query': ({ query }) => ({
    query
  })
});

const mockRequestAdapter = createAlovaMockAdapter([mocks], {
  delay: 50,
  onMockResponse: ({ status, statusText, body }) => {
    // 当status为错误码时，如果包含notError则以body的形式返回错误信息
    if (status >= 300) {
      if (!/notError/.test(statusText)) {
        const err = new Error(statusText);
        err.name = status.toString();
        throw err;
      } else {
        body = {
          status,
          statusText
        };
      }
    }
    return {
      response: body,
      headers: {} as Record<string, number | string>
    };
  },
  mockRequestLogger: false
});

const getAlovaInstance = (baseURL: string) => {
  const alova = createAlova({
    baseURL,
    statesHook: VueHook,
    requestAdapter: GlobalFetch(),
    responded: r => r.json()
  });

  // l2Cache is null in node by default
  alova.options.l2Cache = alova.l1Cache;
  return alova;
};

const createDefaultRateLimiter = () =>
  createRateLimiter({
    points: 4,
    duration: 60 * 1000, // 60 s
    blockDuration: 100 * 1000 // 100 s
  });

describe('rateLimit', () => {
  const alova = createAlova({
    statesHook: VueHook,
    requestAdapter: mockRequestAdapter
  });
  alova.options.l2Cache = alova.l1Cache;

  const limiter = createDefaultRateLimiter();

  test('should have null initial value', async () => {
    const limitedGetter = limiter(alova.Get('/unit-test'));
    await expect(limitedGetter.get()).resolves.toBeNull();
  });

  test('should consume when trying to send request', async () => {
    const limitedGetter = limiter(alova.Get('/return-query'));
    let res = await limitedGetter.get();
    expect(res).toBeNull();

    await limitedGetter.send();
    await limitedGetter.send();
    await limitedGetter.send();
    await limitedGetter.send();

    res = await limitedGetter.get();
    expect(res).toMatchObject({
      remainingPoints: 0,
      consumedPoints: 4
    });
  });

  test('should consume 1 point', async () => {
    const limitedGetter = limiter(alova.Get('/unit-test'));

    await limitedGetter.consume().then(res =>
      expect(res.toJSON()).toMatchObject({
        remainingPoints: 3,
        consumedPoints: 1,
        isFirstInDuration: true
      });
      expect(consumeRes.msBeforeNext).toBeGreaterThanOrEqual(5 * 1000);
    });

    const res = await limitedGetter.get();
    expect(res?.consumedPoints).toBe(1);
    expect(res?.isFirstInDuration).toBe(false);
    expect(res?.remainingPoints).toBe(3);
  });

  test('should be rejected and blocked when consumed more than points', async () => {
    jest.useFakeTimers();
    const limitedGetter = limiter(alova.Get('/unit-test'));

    await expect(() => limitedGetter.consume()).not.toThrow();

    const consumeRes = await limitedGetter.consume(4).catch(e => e.toJSON());
    expect(consumeRes).toMatchObject({
      remainingPoints: 0,
      consumedPoints: 5,
      isFirstInDuration: false
    });
    // be blocked for consuming too many points
    expect(consumeRes.msBeforeNext).toBeGreaterThanOrEqual(99 * 1000);

    // Fast forward to after the block duration
    await jest.setSystemTime(Date.now() + 100 * 1000);

    // unblock now
    await expect(limitedGetter.get()).resolves.toBeNull();
    jest.useRealTimers();
  });

  test('use key function', async () => {
    let isJerry = false;

    const limitedGetter = limiter(alova.Get('/unit-test'), {
      key: () => (isJerry ? 'Jerry' : 'Tom')
    });

    let consumeRes = await limitedGetter.consume(5).catch(e => e.toJSON());
    expect(consumeRes).toMatchObject({
      remainingPoints: 0,
      consumedPoints: 5
    });
    // be blocked for consuming too many points
    expect(consumeRes.msBeforeNext).toBeGreaterThanOrEqual(99 * 1000);

    isJerry = true;

    // Jerry should not be blocked.
    await limitedGetter.consume().then(res =>
      expect(res.toJSON()).toMatchObject({
        remainingPoints: 3,
        consumedPoints: 1,
        isFirstInDuration: true
      })
    );

    isJerry = false;

    // Poor Tom is still blocked.
    consumeRes = await limitedGetter.consume().catch(e => e.toJSON());
    expect(consumeRes).toMatchObject({
      remainingPoints: 0,
      consumedPoints: 6,
      isFirstInDuration: false
    });
  });
});

describe('reteLimit in server', () => {
  jest.useRealTimers();
  const baseURL = 'http://localhost:9527';
  let alova = getAlovaInstance(baseURL);
  let limiter = createDefaultRateLimiter();

  const mockServer = setupServer(
    http.post(`${baseURL}/login`, async ({ request }) => {
      const { username, password } = (await request.json()) as any;
      if (username === 'user' && password === 'password') {
        return HttpResponse.json({
          code: 0,
          msg: 'success',
          data: { token: '000-111-222-333-444' }
        });
      }
      return HttpResponse.json({
        code: -1,
        msg: 'failed',
        data: null
      });
    }),

    http.post(`${baseURL}/login-entry`, async ({ request }) => {
      const { username, password } = (await request.json()) as any;
      if (!username) {
        return HttpResponse.json(
          {
            code: -1,
            msg: 'lack of username',
            data: null
          },
          { status: 403 }
        );
      }

      const limitedGetter = limiter(alova.Post<MockResponse>('/login', { username, password }), {
        key: () => username as string
      });

      const limitedResult = await limitedGetter.get();
      if (limitedResult && limitedResult.remainingPoints <= 0) {
        return HttpResponse.json({
          code: -100,
          msg: 'too many requests',
          data: null
        });
      }

      const res = await limitedGetter.send();

      if (res.code === 0) {
        await limitedGetter.delete();
      }

      return HttpResponse.json(res);
    }),
    http.get(`${baseURL}/test`, () => HttpResponse.json({ name: 123 }))
  );

  mockServer.listen();
  beforeEach(() => {
    mockServer.resetHandlers();
    alova = getAlovaInstance(baseURL);
    limiter = createDefaultRateLimiter();
  });
  afterAll(() => mockServer.close());

  test('should login', async () => {
    const alova = getAlovaInstance(baseURL);
    const res = await alova.Post<MockResponse>('/login-entry', {
      username: 'user',
      password: 'password'
    });

    expect(res).toMatchObject({
      code: 0,
      msg: 'success'
    });
  });

  test('should rejected after 4 times failure', async () => {
    const alova = getAlovaInstance(baseURL);
    const badRequest = alova.Post<MockResponse>('/login-entry', {
      username: 'user',
      password: 'i-dont-know-the-pass'
    });

    const goodRequest = alova.Post<MockResponse>('/login-entry', {
      username: 'user',
      password: 'password'
    });

    expect(await badRequest.send()).toMatchObject({ code: -1 });
    expect(await badRequest.send()).toMatchObject({ code: -1 });
    expect(await badRequest.send()).toMatchObject({ code: -1 });
    expect(await badRequest.send()).toMatchObject({ code: -1 });

    // now consumed all points

    // block all request in duration, even good request
    expect(await goodRequest.send()).toMatchObject({ code: -100 });
  });

  test('should delete after login', async () => {
    const badRequest = alova.Post<MockResponse>('/login-entry', {
      username: 'user',
      password: 'i-dont-know-the-pass'
    });

    const goodRequest = alova.Post<MockResponse>('/login-entry', {
      username: 'user',
      password: 'password'
    });

    expect(await badRequest.send()).toMatchObject({ code: -1 });
    expect(await badRequest.send()).toMatchObject({ code: -1 });
    expect(await badRequest.send()).toMatchObject({ code: -1 });

    // remaining point: 1
    expect(await goodRequest.send()).toMatchObject({ code: 0 });

    // remaining point: 4
    expect(await badRequest.send()).toMatchObject({ code: -1 });
    expect(await badRequest.send()).toMatchObject({ code: -1 });
    expect(await badRequest.send()).toMatchObject({ code: -1 });
    expect(await badRequest.send()).toMatchObject({ code: -1 });

    // now consumed all points

    expect(await badRequest.send()).toMatchObject({ code: -100 });
  });
});
