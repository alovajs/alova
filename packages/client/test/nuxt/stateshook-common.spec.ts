import nuxtHookClient from '@/statesHook/nuxt';
import { ReferingObject } from 'alova';
import { NuxtApp } from 'nuxt/app';
import { delay } from 'root/testUtils';
import { getCurrentInstance, ref } from 'vue';
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
describe('nuxt adapter - common', async () => {
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
      forward: vi.fn((data: any) => (data.type === 'mock' ? data.value : data)),
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

  test('should throw error when useNuxtApp is not a function', async () => {
    expect(() => {
      const invalidConfig = { nuxtApp: 'not a function' } as unknown as NuxtHookConfig;
      nuxtHookClient(invalidConfig);
    }).toThrowError('`useNuxtApp` is required in nuxt states hook');
  });

  test('should dehydrate state by returning its value', () => {
    const adapter = nuxtHookClient(mockConfig);
    const state = adapter.create('testValue', 'testKey', referingObject);
    const result = adapter.dehydrate(state, 'testKey', referingObject);
    expect(result).toBe('testValue');
  });

  test('should update state value', () => {
    const adapter = nuxtHookClient(mockConfig);
    const state = adapter.create('testValue', 'testKey', referingObject);
    adapter.update('newValue', state, 'testKey', referingObject);
    expect(state.value).toBe('newValue');
  });

  test('should setup watchers for watchingStates', async () => {
    const adapter = nuxtHookClient(mockConfig);
    const handler = vi.fn();
    const removeStates = vi.fn();
    const state1 = ref(1);
    const state2 = ref(2);

    adapter.effectRequest(
      {
        handler,
        removeStates,
        immediate: false,
        watchingStates: [state1, state2],
        frontStates: {}
      },
      referingObject
    );

    state1.value = 3;
    state2.value = 4;
    await delay(100);
    expect(handler).toHaveBeenCalledTimes(2);
  });
});
