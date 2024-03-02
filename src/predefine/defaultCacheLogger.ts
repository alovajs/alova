import { STORAGE_RESTORE, isSSR, len } from '@/utils/variables';
import { CacheMode } from '~/typings';
import { Method } from '..';

const titleStyle = 'color: black; font-size: 12px; font-weight: bolder';
/**
 * 默认cacheLogger函数
 */
export default (response: any, methodInstance: Method, cacheMode: CacheMode, tag: string | number | undefined) => {
  const cole = console,
    log = (...args: any[]) => console.log(...args),
    url = methodInstance.url,
    isRestoreMode = cacheMode === STORAGE_RESTORE,
    hdStyle = '\x1B[42m%s\x1B[49m',
    labelStyle = '\x1B[32m%s\x1B[39m',
    startSep = ` [HitCache]${url} `,
    endSepFn = () => Array(len(startSep) + 1).join('^');
  if (isSSR) {
    log(hdStyle, startSep);
    log(labelStyle, ' Cache ', response);
    log(labelStyle, ' Mode  ', cacheMode);
    isRestoreMode && log(labelStyle, ' Tag   ', tag);
    log(labelStyle, endSepFn());
  } else {
    cole.groupCollapsed
      ? cole.groupCollapsed('%cHitCache', 'padding: 2px 6px; background: #c4fcd3; color: #53b56d;', url)
      : log(hdStyle, startSep);

    log('%c[Cache]', titleStyle, response);
    log('%c[Mode]', titleStyle, cacheMode);
    isRestoreMode && log('%c[Tag]', titleStyle, tag);
    log('%c[Method]', titleStyle, methodInstance);
    cole.groupEnd ? cole.groupEnd() : log(labelStyle, endSepFn());
  }
};
