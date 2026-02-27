import { isAlovaCacheKey } from '@alova/shared';
import { AlovaGlobalCacheAdapter } from 'alova';

export default {
  get(key) {
    return uni.getStorageSync(key);
  },
  set(key, value) {
    uni.setStorageSync(key, value);
  },
  remove(key) {
    uni.removeStorageSync(key);
  },
  clear() {
    // 获取所有存储的键
    const storageInfo = uni.getStorageInfoSync();
    const keys = storageInfo.keys || [];

    // 只删除alova相关的缓存
    keys.forEach(key => {
      if (isAlovaCacheKey(key)) {
        uni.removeStorageSync(key);
      }
    });
  }
} as AlovaGlobalCacheAdapter;
