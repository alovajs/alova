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
    Taro.clearStorageSync();
  }
} as AlovaGlobalCacheAdapter;
