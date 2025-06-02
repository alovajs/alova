import nuxtHook from '@/statesHook/nuxt';
import { ReferingObject } from 'alova';
import { NuxtApp } from 'nuxt/app';

// Mock the object returned by useNuxtApp
const mockUseNuxtApp = () => {
  const hooks = {
    hook: vi.fn()
  };
  const payload = {};
  return { hooks, payload } as unknown as NuxtApp;
};

// Mock SSR environment
const mockSSR = (isSSR: boolean) => {
  Object.defineProperty(global, 'window', {
    value: isSSR ? undefined : {},
    writable: true
  });
};

describe('Nuxt States Hook', () => {
  const referingObject: ReferingObject = {
    trackedKeys: {},
    bindError: false
  };
  test('create method initializes state from payload in SSR environment', () => {
    mockSSR(true);
    const nuxtApp = mockUseNuxtApp();
    const hook = nuxtHook({ nuxtApp: () => nuxtApp });
    const testKey = 'testKey';
    const initialData = { foo: 'bar' };
    nuxtApp.payload[`alova_${testKey}_1`] = { foo: 'serialized' };

    const state = hook.create(initialData, testKey, referingObject);
    expect(state.value).toEqual({ foo: 'serialized' });
  });

  test('create method uses initial data in client environment', () => {
    mockSSR(false);
    const nuxtApp = mockUseNuxtApp();
    const hook = nuxtHook({ nuxtApp: () => nuxtApp });
    const initialData = { foo: 'bar' };

    const state = hook.create(initialData, 'testKey', referingObject);
    expect(state.value).toEqual(initialData);
  });

  test('update method serializes data in SSR environment', () => {
    mockSSR(true);
    const nuxtApp = mockUseNuxtApp();
    const hook = nuxtHook({ nuxtApp: () => nuxtApp });
    const state = { value: null };
    const newVal = { foo: 'new' };

    hook.update(newVal, state);
    expect(state.value).toEqual(hook.serializer.serialize(newVal));
  });

  test('update method directly updates value in client environment', () => {
    mockSSR(false);
    const nuxtApp = mockUseNuxtApp();
    const hook = nuxtHook({ nuxtApp: () => nuxtApp });
    const state = { value: null };
    const newVal = { foo: 'new' };

    hook.update(newVal, state);
    expect(state.value).toBe(newVal);
  });

  test('effectRequest triggers request with watchingStates', () => {
    mockSSR(false);
    const nuxtApp = mockUseNuxtApp();
    const hook = nuxtHook({ nuxtApp: () => nuxtApp });
    const handler = vi.fn();
    const state1 = ref(1);
    const state2 = ref(2);

    hook.effectRequest({ handler, watchingStates: [state1, state2] });
    state1.value = 2;
    expect(handler).toHaveBeenCalledWith(0);
  });

  test('computed method returns reactive value', () => {
    const hook = nuxtHook({ nuxtApp: mockUseNuxtApp });
    const count = ref(1);
    const double = hook.computed(() => count.value * 2);
    expect(double.value).toBe(2);
  });

  test('watch method triggers callback on state change', () => {
    const hook = nuxtHook({ nuxtApp: mockUseNuxtApp });
    const state = ref(0);
    const callback = vi.fn();

    hook.watch(state, callback);
    state.value = 1;
    expect(callback).toHaveBeenCalledWith(1, 0);
  });

  test('onMounted method calls callback when component mounted', () => {
    const hook = nuxtHook({ nuxtApp: mockUseNuxtApp });
    const callback = vi.fn();
    const originalGetInstance = getCurrentInstance;
    vi.spyOn(global, 'getCurrentInstance').mockReturnValue({} as any);

    hook.onMounted(callback);
    expect(callback).not.toHaveBeenCalled();
    onMounted.mock.calls[0][0]();
    expect(callback).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  test('custom serializer works in create method', () => {
    mockSSR(true);
    const customSerializer = {
      forward: data => ({ serialized: data }),
      backward: payload => payload.serialized
    };
    const nuxtApp = mockUseNuxtApp();
    const hook = nuxtHook({ nuxtApp: () => nuxtApp, serializer: { data: customSerializer } });
    nuxtApp.payload.alova_testKey_1 = { serialized: 'customData' };

    const state = hook.create('initialData', 'testKey');
    expect(state.value).toBe('customData');
  });

  test('custom serializer works in update method (SSR)', () => {
    mockSSR(true);
    const customSerializer = {
      forward: data => ({ serialized: data }),
      backward: payload => payload.serialized
    };
    const nuxtApp = mockUseNuxtApp();
    const hook = nuxtHook({ nuxtApp: () => nuxtApp, serializer: { data: customSerializer } });
    const state = { value: null };

    hook.update('newData', state);
    expect(state.value).toEqual({ serialized: 'newData' });
  });

  test('custom serializer not applied in client update', () => {
    mockSSR(false);
    const customSerializer = {
      forward: data => ({ serialized: data }),
      backward: payload => payload.serialized
    };
    const nuxtApp = mockUseNuxtApp();
    const hook = nuxtHook({ nuxtApp: () => nuxtApp, serializer: { data: customSerializer } });
    const state = { value: null };

    hook.update('newData', state);
    expect(state.value).toBe('newData');
  });

  test('onUnmounted method calls callback when component unmounted', () => {
    const hook = nuxtHook({ nuxtApp: mockUseNuxtApp });
    const callback = vi.fn();
    const originalGetInstance = getCurrentInstance;
    vi.spyOn(global, 'getCurrentInstance').mockReturnValue({} as any);

    hook.onUnmounted(callback);
    onUnmounted.mock.calls[0][0]();
    expect(callback).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  test('effectRequest triggers request after client mount', () => {
    mockSSR(false);
    const nuxtApp = mockUseNuxtApp();
    const hook = nuxtHook({ nuxtApp: () => nuxtApp });
    const handler = vi.fn();
    const removeStates = vi.fn();

    hook.effectRequest({ handler, removeStates, immediate: true });
    // Trigger app:mounted hook
    expect(removeStates).not.toHaveBeenCalled();
    onUnmounted.mock.calls[0][0]();
    expect(removeStates).toHaveBeenCalled();
    nuxtApp.hooks.hook.mock.calls[0][1]();
    expect(allowRequest).toBe(true);
    expect(handler).toHaveBeenCalled();
  });
});
