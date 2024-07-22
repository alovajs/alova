import { VueOptionsHook } from '@/index';
import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';

/**
 * 根据不同vue版本号返回对应的事件集合
 * @param events 事件集合
 * @returns 对应vue版本支持的事件集合
 */
const isVue3 = process.env.VUE_VERSION === 'v3';
export const eventObj = (events: Record<string, any>) => ({
  listeners: isVue3 ? {} : events,
  attrs: isVue3
    ? Object.keys(events).reduce(
        (obj, key) => {
          obj[`on${key[0].toUpperCase()}${key.slice(1)}`] = events[key];
          return obj;
        },
        {} as Record<string, any>
      )
    : {}
});

export const createTestAlova = () =>
  createAlova({
    baseURL: process.env.NODE_BASE_URL,
    statesHook: VueOptionsHook,
    requestAdapter: adapterFetch(),
    responded: response => response.json(),
    cacheFor: null
  });
