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
const importNuxtHook = async () => {
  Object.defineProperty(global, 'window', {
    value: undefined,
    writable: true
  });
  const { default: nuxtHook } = await import('@/statesHook/nuxt');
  return nuxtHook;
};
describe('nuxt.ts adapter', async () => {
  const counterKey = '__ALOVA_COUNTER';
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
      serializer: {
        mock: mockSerializer
      }
    };

    // Mock getCurrentInstance to return something by default
    vi.mocked(getCurrentInstance).mockReturnValue({} as any);
  });

  const nuxtHookServer = await importNuxtHook();
  // must import testing module after mocking window
  test('should create state and serialize data', () => {
    const adapter = nuxtHookServer(mockConfig);
    const state1 = adapter.create('test1', 'testKey1', referingObject);
    const state2 = adapter.create('test2', 'testKey1', referingObject);
    expect(state1.value).toBe('test1');
    expect(state2.value).toBe('test2');
    expect(mockNuxtApp.payload.alova_testKey1_1).toBeUndefined();
    expect(mockNuxtApp.payload.alova_testKey1_2).toBeUndefined();
    expect((mockNuxtApp as any)[counterKey]).toBe(2);
    expect(mockNuxtApp.hooks.hook).toHaveBeenCalledTimes(2);
    mockNuxtApp.hooks.callHook('app:rendered', '' as any);
    expect(mockNuxtApp.payload.alova_testKey1_1).toBe('test1');
    expect(mockNuxtApp.payload.alova_testKey1_2).toBe('test2');
  });

  test('should serialize data with serializers', () => {
    const adapter = nuxtHookServer(mockConfig);
    // internal serializer
    const error = new Error('mock error');
    const state1 = adapter.create(error, 'testKey1', referingObject);
    expect(state1.value).toBeInstanceOf(Error);
    mockNuxtApp.hooks.callHook('app:rendered', '' as any);
    expect(mockNuxtApp.payload.alova_testKey1_1).toStrictEqual([
      'error',
      {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    ]);

    // custom serializer
    adapter.create({ type: 'mock', value: '123' }, 'testKey2', referingObject);
    mockNuxtApp.hooks.callHook('app:rendered', '' as any);
    expect(mockNuxtApp.payload.alova_testKey2_2).toStrictEqual(['mock', '123']);
  });

  test("shouldn't immediately call handler in effectRequest even when immediate is true", () => {
    const adapter = nuxtHookServer(mockConfig);
    const handler = vi.fn();
    const removeStates = vi.fn();

    adapter.effectRequest(
      {
        handler,
        removeStates,
        immediate: true,
        watchingStates: [],
        saveStates: () => {},
        frontStates: {}
      },
      referingObject
    );
    expect(handler).toHaveBeenCalled();
    expect(mockNuxtApp.hooks.hook).toHaveBeenCalledTimes(1);
  });
});
