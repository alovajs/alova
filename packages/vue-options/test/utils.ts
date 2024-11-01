import { VueOptionsHook } from '@/index';
import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';

/**
 * Return the corresponding event collection according to different vue version numbers
 * @param events event collection
 * @returns Corresponding event collection supported by vue version
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
