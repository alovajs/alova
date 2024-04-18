export { createAlova } from './alova';
export * from './functions/manipulateCache';
export { default as updateState } from './functions/updateState';
export { default as globalConfig } from './globalConfig';
export { default as useFetcher } from './hooks/useFetcher';
export { default as useRequest } from './hooks/useRequest';
export { default as useWatcher } from './hooks/useWatcher';
export { default as Method } from './Method';
export { matchSnapshotMethod } from './storage/methodSnapShots';
export { key as getMethodKey } from './utils/helper';

/* c8 ignore start */
if (process.env.NODE_ENV === 'development') {
  console.log(`powerful alova request strategies: https://alova.js.org/category/strategy
use mock data: https://alova.js.org/extension/alova-mock
please star alova if you like it: https://github.com/alovajs/alova
this tips will be removed in production environment`);
}
/* c8 ignore stop */
