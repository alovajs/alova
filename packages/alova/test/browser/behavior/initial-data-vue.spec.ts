import { getAlovaInstance, Result, untilCbCalled } from '#/utils';
import { useRequest, useWatcher } from '@/index';
import VueHook from '@/predefine/VueHook';
import { ref } from 'vue';

describe('Initial data before request', function () {
  test('[useRequest]should assign the initial data to state `data`', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });
    const { data, onSuccess } = useRequest(Get, {
      initialData: { method: 'NO' }
    });
    expect(data.value).toEqual({ method: 'NO' }); // 先指定了initialData，所以直接带出了initialData
    await untilCbCalled(onSuccess);
    expect(data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} }); // 因为有持久化数据，因此直接带出了持久化的数据
  });

  test('[useWatcher]should assign the initial data to state `data`', async () => {
    const stateA = ref('a');
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });
    const { data, onSuccess } = useWatcher(() => Get, [stateA], {
      initialData: { method: 'NO' },
      immediate: true
    });
    expect(data.value).toEqual({ method: 'NO' }); // 先指定了initialData，所以直接带出了initialData
    await untilCbCalled(onSuccess);
    expect(data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} }); // 因为有持久化数据，因此直接带出了持久化的数据
  });
});
