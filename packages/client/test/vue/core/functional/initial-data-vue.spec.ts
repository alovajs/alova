import { getAlovaInstance } from '#/utils';
import { useRequest, useWatcher } from '@/index';
import VueHook from '@/statesHook/vue';
import { Result, untilCbCalled } from 'root/testUtils';
import { ref } from 'vue';

describe('Initial data before request', () => {
  test('[useRequest]should assign the initial data to state `data`', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    const { data, onSuccess } = useRequest(Get, {
      initialData: { method: 'NO' }
    });
    expect(data.value).toEqual({ method: 'NO' }); // The initial data is specified first, so the initial data is directly brought out
    await untilCbCalled(onSuccess);
    expect(data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} }); // Because there is persistent data, the persistent data is directly brought out
  });

  test('[useWatcher]should assign the initial data to state `data`', async () => {
    const stateA = ref('a');
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    const { data, onSuccess } = useWatcher(() => Get, [stateA], {
      initialData: { method: 'NO' },
      immediate: true
    });
    expect(data.value).toEqual({ method: 'NO' }); // The initial data is specified first, so the initial data is directly brought out
    await untilCbCalled(onSuccess);
    expect(data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} }); // Because there is persistent data, the persistent data is directly brought out
  });
});
