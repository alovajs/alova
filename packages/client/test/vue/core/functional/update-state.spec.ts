import { getAlovaInstance } from '#/utils';
import { removeStateCache } from '@/hooks/core/implements/stateCache';
import { updateState, useRequest } from '@/index';
import VueHook from '@/statesHook/vue';
import { key } from '@alova/shared';

import { queryCache } from 'alova';
import { Result, untilCbCalled } from 'root/testUtils';
import { Ref, ref } from 'vue';

describe('update cached response data by user in vue', () => {
  test('test update function', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: 100000,
      transform: ({ data }: Result) => data
    });
    const { data, onSuccess } = useRequest(Get);
    await untilCbCalled(onSuccess);
    const updated = await updateState(Get, responseData => {
      responseData.path = '/unit-test-updated';
      return responseData;
    });
    expect(data.value.path).toBe('/unit-test-updated');
    expect(updated).toBeTruthy();
  });

  test("shouldn't be called when not get any states", async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      params: { a: 1 },
      cacheFor: 100000,
      transform: ({ data }: Result) => data
    });

    const mockfn = vi.fn();
    const updated = await updateState(Get, data => {
      mockfn();
      return data;
    });
    expect(mockfn).not.toHaveBeenCalled();
    expect(updated).toBeFalsy();
  });

  test("shouldn't throw any error when not match any one", async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      name: 'get1',
      params: { a: 1 },
      cacheFor: 100000,
      transform: ({ data }: Result) => data
    });
    const Get2 = alova.Get('/unit-test', {
      name: 'get2',
      params: { b: 2 },
      cacheFor: 100000,
      transform: ({ data }: Result) => data
    });

    const { onSuccess: get1OnSuccess, data: get1Data } = useRequest(Get1);
    const { onSuccess: get2OnSuccess, data: get2Data } = useRequest(Get2);
    await Promise.all([untilCbCalled(get1OnSuccess), untilCbCalled(get2OnSuccess)]);

    // Will not match any method instance
    await updateState(alova.Get(''), (data: any) => {
      data.path = '/unit-test-updated';
      return data;
    });

    // If multiple method instances are matched, only the first one will be updated.
    expect(get1Data.value.path).toBe('/unit-test');
    expect(get2Data.value.path).toBe('/unit-test');
  });

  test('update extra managed states', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: 100000,
      transform: ({ data }: Result) => data
    });

    const extraData = ref(0);
    const extraData2 = 1;
    const { onSuccess, data } = useRequest(Get, {
      managedStates: {
        extraData,
        extraData2: extraData2 as unknown as Ref<number>
      }
    });
    await untilCbCalled(onSuccess);

    // Non-state data cannot be updated
    await expect(
      updateState(Get, {
        extraData2: () => 1
      })
    ).rejects.toThrow("Cannot create property 'value' on number '1'");

    // Status not found throws error
    await expect(
      updateState(Get, {
        extraData3: () => 1
      })
    ).rejects.toThrow('state named `extraData3` is not found');

    // Update successful
    await updateState(Get, {
      extraData: () => 1
    });
    expect(extraData.value).toBe(1);

    // When updating the state of additional management, its cache will not be involved
    expect(await queryCache(Get)).toStrictEqual(data.value);
  });

  test("shouldn't return false when matched method instance but has no cached states", async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      name: 'get10',
      params: { a: 1 },
      cacheFor: 100000,
      transform: ({ data }: Result) => data
    });

    const { onSuccess } = useRequest(Get1);
    await untilCbCalled(onSuccess);
    removeStateCache(alova.id, key(Get1));

    const mockUpdateFn = vi.fn();
    const updated = await updateState(Get1, (data: any) => {
      mockUpdateFn();
      return data;
    });

    expect(mockUpdateFn).not.toHaveBeenCalled();
    expect(updated).toBeFalsy();
  });
});
