import { getAlovaInstance } from '#/utils';
import VueHook from '@/predefine/VueHook';
import defaultCacheLogger from '@/predefine/defaultCacheLogger';

const groupCollapsed = console.groupCollapsed;
const groupEnd = console.groupEnd;
describe('defaultCacheLogger client', function () {
  test('log with memery mode', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1 },
      name: 'get-method'
    });
    const response = await Get1;
    defaultCacheLogger(response, Get1, 'memory', undefined);

    (console as any).groupCollapsed = (console as any).groupEnd = undefined;
    defaultCacheLogger(response, Get1, 'memory', undefined);
    console.groupCollapsed = groupCollapsed;
    console.groupEnd = groupEnd;
  });

  test('log with restore mode', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1 },
      name: 'get-method'
    });
    const response = await Get1;

    defaultCacheLogger(response, Get1, 'restore', 'v1');
    (console as any).groupCollapsed = (console as any).groupEnd = undefined;
    defaultCacheLogger(response, Get1, 'restore', 'v1');
    console.groupCollapsed = groupCollapsed;
    console.groupEnd = groupEnd;
  });
});
