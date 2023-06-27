import { getAlovaInstance, Result, untilCbCalled } from '#/utils';
import { useRequest } from '@/index';
import ReactHook from '@/predefine/ReactHook';
import React, { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';

// use hook在服务端不再发送请求
describe('[react]use hooks in SSR', function () {
  test("shouldn't request but loading is true", async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json(),
      endWithSlash: true
    });
    const Get = alova.Get('/unit-test', {
      params: { a: 'a', b: 'str' },
      transformData: ({ data }: Result) => data
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
    await untilCbCalled(setTimeout, 200);
    expect(successMockFn).not.toBeCalled();
  });
});
