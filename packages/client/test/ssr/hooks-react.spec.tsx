<<<<<<< HEAD:test/server/hooks-react.spec.tsx
import { delay, getAlovaInstance, Result } from '#/utils';
=======
import { getAlovaInstance } from '#/utils';
>>>>>>> next:packages/client/test/ssr/hooks-react.spec.tsx
import { useRequest } from '@/index';
import ReactHook from '@/statesHook/react';
import React, { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { delay, Result } from 'root/testUtils';

// use hook在服务端不再发送请求
describe('[react]use hooks in SSR', () => {
  test("shouldn't request but loading is true", async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      params: { a: 'a', b: 'str' },
      transform: ({ data }: Result) => data
    });

    const successMockFn = jest.fn();
    function Page() {
      const { loading, data = { path: '', method: '' }, onSuccess } = useRequest(Get);
      onSuccess(successMockFn);
      return (
        <div role="wrap">
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="path">{data.path}</span>
          <span role="method">{data.method}</span>
        </div>
      );
    }
    const html = renderToString((<Page />) as ReactElement<any, any>);
    expect(html).toMatch('<span role="status">loading</span>');
    expect(html).toMatch('<span role="path"></span>');
    expect(html).toMatch('<span role="method"></span>');

    // 200ms后依然为请求前状态
    await delay(200);
    expect(successMockFn).not.toHaveBeenCalled();
  });
});
