import { isAlovaCacheKey } from '@alova/shared';
import Taro from '@tarojs/taro';
import { AlovaGlobalCacheAdapter } from 'alova';

export default {
  get(key) {
    return Taro.getStorageSync(key);
  },
  set(key, value) {
    Taro.setStorageSync(key, value);
  },
  remove(key) {
    Taro.removeStorageSync(key);
  },
  clear() {
    // 获取所有存储的键
    const storageInfo = Taro.getStorageInfoSync();
    const keys = storageInfo.keys || [];

    // 只删除alova相关的缓存
    keys.forEach(key => {
      if (isAlovaCacheKey(key)) {
        Taro.removeStorageSync(key);
      }
    });
  }
} as AlovaGlobalCacheAdapter;
