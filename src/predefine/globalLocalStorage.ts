import { AlovaGlobalStorage } from '../../typings';
import { JSONParse, JSONStringify } from '../utils/variables';

/**
 * 创建默认的localStorage存储适配器
 */
export default () => {
  const localStorage = window.localStorage;
  return {
    set: (key, value) => localStorage.setItem(key, JSONStringify(value)),
    get: key => {
      const data = localStorage.getItem(key);
      return data ? JSONParse(data) : data;
    },
    remove: key => localStorage.removeItem(key)
  } as AlovaGlobalStorage;
};
