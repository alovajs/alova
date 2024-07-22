import { updateState, useRequest } from '@/index';
import { createAlova } from 'alova';
import GlobalFetch from 'alova/fetch';

describe('createAlova', () => {
  test('should throw error in useHooks when statesHook is not specific', async () => {
    const alova = createAlova({
      requestAdapter: GlobalFetch()
    });
    const methodInst = alova.Get('http://localhost:3000/unit-test', {
      transform: (response: Response) => response.json()
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
    }).toThrow('`statesHook` is not set in alova instance');

    expect(() => updateState(methodInst, {})).rejects.toThrow('`statesHook` is not set in alova instance');
  });
});
