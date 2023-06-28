import { CacheMode } from '~/typings';
import { Method } from '..';

const titleStyle = 'color: black; font-size: 12px; font-weight: bolder';
/**
 * 默认cacheLogger函数
 */
export default (response: any, methodInstance: Method, cacheMode: CacheMode, tag: string | number | undefined) => {
  const cole = console;
  cole.groupCollapsed('%cHitCache', 'padding: 2px 6px; background: #c4fcd3; color: #53b56d;', methodInstance.url);
  cole.log('%c[Mode]', titleStyle, cacheMode);
  if (cacheMode === 'restore') {
    cole.log('%c[Tag]', titleStyle, tag);
  }
  cole.log('%c[Method]', titleStyle, methodInstance);
  cole.log('%c[Cache]', titleStyle, response);
  cole.groupEnd();
};
