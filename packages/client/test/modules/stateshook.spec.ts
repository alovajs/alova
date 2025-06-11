import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import reactHook from 'alova/react';
import vueHook from 'alova/vue';

describe('createAlova', () => {
  test("shouldn't throw different statesHook error", async () => {
    expect(() => {
      createAlova({
        statesHook: {
          ...vueHook
        },
        requestAdapter: adapterFetch()
      });
      createAlova({
        statesHook: {
          ...vueHook
        },
        requestAdapter: adapterFetch()
      });
    }).not.toThrowError();
  });

  test('should throw different statesHook error', async () => {
    expect(() => {
      createAlova({
        statesHook: {
          ...vueHook
        },
        requestAdapter: adapterFetch()
      });
      createAlova({
        statesHook: {
          ...reactHook
        },
        requestAdapter: adapterFetch()
      });
    }).toThrowError('expected to use the same `statesHook`');
  });
});
