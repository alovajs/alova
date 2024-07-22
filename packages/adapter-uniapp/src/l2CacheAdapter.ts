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
    uni.clearStorageSync();
  }
} as AlovaGlobalCacheAdapter;
