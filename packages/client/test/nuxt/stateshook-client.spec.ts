import { useRequest } from '@/index';
import nuxtHook from '@/statesHook/nuxt';
import { createAlova, ReferingObject } from 'alova';
import adapterFetch from 'alova/fetch';
import { NuxtApp } from 'nuxt/app';
import { delay } from 'root/testUtils';
import { getCurrentInstance } from 'vue';
import { DataSerializer } from '~/typings/clienthook';
import { NuxtHookConfig } from '~/typings/stateshook/nuxt';

// Mock Vue functions
vi.mock('vue', async importOriginal => {
  const original = await importOriginal<typeof import('vue')>();
  return {
    ...original,
    getCurrentInstance: vi.fn(),
    onMounted: vi.fn(),
    onUnmounted: vi.fn()
  };
});
const referingObject: ReferingObject = {
  trackedKeys: {},
  bindError: false,
  initialRequest: true // assume server-side request was triggered
};
describe('nuxt adapter - client', async () => {
  let mockNuxtApp: NuxtApp;
  let mockSerializer: DataSerializer;
  let mockConfig: NuxtHookConfig;

  beforeEach(() => {
    vi.resetAllMocks();

    const hookCallbacks = {} as Record<string, ((...args: any[]) => void)[]>;
    mockNuxtApp = {
      payload: {},
      hooks: {
        hook: vi.fn((key: string, callback: (...args: any[]) => void) => {
          if (!hookCallbacks[key]) {
            hookCallbacks[key] = [];
          }
          hookCallbacks[key].push(callback);
        }),
        callHook: vi.fn((key: string, ...args: any[]) => {
          const callbacks = hookCallbacks[key];
          callbacks?.forEach(cb => cb(...args));
        })
      }
    } as unknown as NuxtApp;

    mockSerializer = {
      forward: vi.fn((data: any) => (data.type === 'mock' ? data.value : undefined)),
      backward: vi.fn((data: any) => ({ type: 'mock', value: data }))
    };
    mockConfig = {
      nuxtApp: () => mockNuxtApp,
      serializers: {
        mock: mockSerializer
      }
    };

    // Mock getCurrentInstance to return something by default
    vi.mocked(getCurrentInstance).mockReturnValue({} as any);
  });

  test('should create state with initial data when no nuxtStatePayload exists', () => {
    const adapter = nuxtHook(mockConfig);
    const state = adapter.create('initialData', 'testKey', referingObject);
    expect(state.value).toBe('initialData');
    expect(mockNuxtApp.payload).toEqual({});
  });

  test('should deserialize data from nuxtStatePayload when it exists', () => {
    const testData = { foo: 'bar' };
    mockNuxtApp.payload.alova_testKey_1 = testData;
    const adapter = nuxtHook(mockConfig);
    const state = adapter.create('initialData', 'testKey', referingObject);
    expect(state.value).toStrictEqual(testData);
  });

  test("shouldn't register app:rendered hook in client", () => {
    const adapter = nuxtHook(mockConfig);
    adapter.create('initialData', 'testKey', referingObject);
    expect(mockNuxtApp.hooks.hook).not.toHaveBeenCalled();
  });

  test("shouldn't immediately call handler in effectRequest until app:mounted is triggered", () => {
    const adapter = nuxtHook(mockConfig);
    const handler = vi.fn();
    const removeStates = vi.fn();

    mockNuxtApp.payload.alova_initialRequest_1 = true; // assume that is requested in server-side
    const callEffectRequest = () =>
      adapter.effectRequest(
        {
          handler,
          removeStates,
          immediate: true,
          watchingStates: [],
          frontStates: {}
        },
        referingObject
      );
    callEffectRequest();
    expect(mockNuxtApp.hooks.hook).toHaveBeenCalledWith('app:mounted', expect.any(Function));
    expect(handler).not.toHaveBeenCalled();

    // Call the mounted hook callback
    mockNuxtApp.hooks.callHook('app:mounted', '' as any);
    callEffectRequest();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('should deserialize data from nuxtStatePayload when it exists', () => {
    const deserializedData = [
      'error',
      {
        name: 'Custom Error',
        message: 'This is a custom error message',
        stack: 'custom stack'
      }
    ];
    mockNuxtApp.payload.alova_testKey_1 = deserializedData;
    const adapter = nuxtHook(mockConfig);
    const state = adapter.create('initialData', 'testKey', referingObject);
    expect(state.value).toBeInstanceOf(Error);
    expect((state.value as Error).name).toBe('Custom Error');
    expect((state.value as Error).message).toBe('This is a custom error message');
    expect((state.value as Error).stack).toBe('custom stack');
  });

  test('should send request without `await` in usehook', async () => {
    const alovaInstance = createAlova({
      baseURL: process.env.NODE_BASE_URL as string,
      statesHook: nuxtHook(mockConfig),
      requestAdapter: adapterFetch()
    });

    const { loading, onSuccess } = useRequest(alovaInstance.Get('/unit-test'));
    const successFn = vi.fn();
    onSuccess(successFn);
    await delay(300);
    expect(loading.value).toBeFalsy();
    expect(successFn).toHaveBeenCalled();
  });
});
