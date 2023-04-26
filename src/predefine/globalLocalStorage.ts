import { AlovaGlobalStorage } from '../../typings';
import { deleteAttr, isSSR, JSONParse, JSONStringify } from '../utils/variables';

/**
 * 创建默认的localStorage存储适配器
 */
const session = {} as Record<string, string>;
const sessionStorage = {
  getItem: (key: string) => session[key],
  setItem: (key: string, value: string) => (session[key] = value),
  removeItem: (key: string) => deleteAttr(session, key)
};
export default () => {
  const storage = isSSR ? sessionStorage : window.localStorage;
  return {
    set: (key, value) => storage.setItem(key, JSONStringify(value)),
    get: key => {
      const data = storage.getItem(key);
      return data ? JSONParse(data) : data;
    },
    remove: key => storage.removeItem(key)
  } as AlovaGlobalStorage;
};
