import { createAlova, updateState, useRequest } from '@/index';
import GlobalFetch from '@/predefine/GlobalFetch';

describe('createAlova', function () {
  test('should throw error in useHooks when statesHook is not specific', async () => {
    const alova = createAlova({
      requestAdapter: GlobalFetch()
    });
    const methodInst = alova.Get('http://localhost:3000/unit-test', {
      transformData: (response: Response) => response.json()
    });
    const result = await methodInst;
    expect(result).toStrictEqual({
      code: 200,
      msg: '',
      data: {
        path: '/unit-test',
        method: 'GET',
        params: {}
      }
    });

    expect(() => {
      useRequest(methodInst);
    }).toThrow('[alova]can not call useHooks until set the `statesHook` at alova instance');

    expect(() => {
      updateState(methodInst, {});
    }).toThrow('[alova]can not call updateState until set the `statesHook` at alova instance');
  });
});
