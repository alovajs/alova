import { AlovaGlobalStorage } from '../../typings/index';
import { JSONParse, JSONStringify } from '../utils/variables';

const localStorage = window.localStorage;
export default <AlovaGlobalStorage>{
  set: (key, value) => localStorage.setItem(key, JSONStringify(value)),
  get: key => {
    const data = localStorage.getItem(key);
    return data ? JSONParse(data) : data;
  },
  remove: key => localStorage.removeItem(key)
};
