import nuxtHook from '@/statesHook/nuxt';
import { ReferingObject } from 'alova';
import { NuxtApp } from 'nuxt/app';
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
  bindError: false
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

  test("shouldn't immediately call handler in effectRequest and then it is available after app:mounted being triggered", () => {
    const adapter = nuxtHook(mockConfig);
    const handler = vi.fn();
    const removeStates = vi.fn();

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
});
