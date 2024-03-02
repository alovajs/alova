import { createAlova } from '@/index';
import GlobalFetch from '@/predefine/GlobalFetch';
import defaultCacheLogger from '@/predefine/defaultCacheLogger';
import { baseURL } from '../mockServer';

describe('defaultCacheLogger server', function () {
  test('log with memery mode', async () => {
    const alova = createAlova({
      baseURL,
      requestAdapter: GlobalFetch()
    });
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1 },
      name: 'get-method'
    });
    const response = await Get1;

    defaultCacheLogger(response, Get1, 'memory', undefined);
  });

  test('log with restore mode', async () => {
    const alova = createAlova({
      baseURL,
      requestAdapter: GlobalFetch()
    });
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1 },
      name: 'get-method'
    });
    const response = await Get1;

    defaultCacheLogger(response, Get1, 'restore', 'v1');
  });
});
