import { createAlova, promiseStatesHook } from '@/index';
import adapterFetch from '@/predefine/adapterFetch';

describe('createAlova', () => {
  test('should get statesHook object with `promiseStatesHook`', async () => {
    createAlova({
      requestAdapter: adapterFetch()
    });
    expect(() => {
      promiseStatesHook();
    }).toThrow('`statesHook` is not set in alova instance');

    const mockStatesHook = {
      name: 'custom',
      create: () => {},
      computed: () => {},
      dehydrate: () => {},
      export: () => {},
      update: () => {},
      effectRequest: () => {},
      watch: () => {},
      onMounted: () => {},
      onUnmounted: () => {}
    };
    createAlova({
      statesHook: mockStatesHook,
      requestAdapter: adapterFetch()
    });
    expect(promiseStatesHook()).toBe(mockStatesHook);
  });
});
