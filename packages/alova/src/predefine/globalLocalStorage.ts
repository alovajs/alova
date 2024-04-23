import { deleteAttr, JSONParse, JSONStringify, noBrowserWin } from '@alova/shared/vars';
import { AlovaGlobalStorage } from '~/typings';

/**
 * 创建默认的localStorage存储适配器
 */
const session = {} as Record<string, string>,
  sessionStorage = {
    getItem: (key: string) => session[key],
    setItem: (key: string, value: string) => (session[key] = value),
    removeItem: (key: string) => deleteAttr(session, key)
  },
  // 设置为函数防止在初始化时报错
  storage = () => (noBrowserWin ? sessionStorage : window.localStorage);
export default {
  set: (key, value) => storage().setItem(key, JSONStringify(value)),
  get: key => {
    const data = storage().getItem(key);
    return data ? JSONParse(data) : data;
  },
  remove: key => storage().removeItem(key)
} as AlovaGlobalStorage;
