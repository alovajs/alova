import { isFn, isPlainObject } from '@alova/shared/function';
import { WatchOptionsWithHandler } from 'vue';
import { AlovaWatcherHandlers, VueWatchHandler } from '../typings';

const mapWatcher = (watcherHandlers: AlovaWatcherHandlers, withPrefix = true, parentKey = '') => {
  const handlerKeys = Object.keys(watcherHandlers || {});
  let finalHandlers = {} as Record<string, VueWatchHandler>;
  handlerKeys.forEach(key => {
    const handlerNames = key.split(/\s*,\s*/);
    const handlerOrHandlers = watcherHandlers[key];
    handlerNames.forEach(handlerName => {
      if (!isPlainObject(handlerOrHandlers) || isFn((handlerOrHandlers as WatchOptionsWithHandler<any>).handler)) {
        const prefix = withPrefix ? 'alovaHook$.' : '';
        finalHandlers[prefix + parentKey + handlerName] = handlerOrHandlers as VueWatchHandler;
      } else {
        finalHandlers = {
          ...finalHandlers,
          ...mapWatcher(handlerOrHandlers as AlovaWatcherHandlers, withPrefix, `${handlerName}.`)
        };
      }
    });
  });
  return finalHandlers;
};

export default mapWatcher;
