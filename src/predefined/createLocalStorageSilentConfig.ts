import { SerializedMethod } from "../../typings";
import { noop } from "../utils/helper";

export default function createLocalStorageSilentConfig() {
  const silentRequestStorageKey = '__$$AlovaSilentRequestStorage$$__';
  return {
    push: (namespace: string, key: string, config: Record<string, any>) => {
      const namespacedSilentStorageKey = namespace + silentRequestStorageKey;
      key = namespace + key;
      localStorage.setItem(key, JSON.stringify(config));
      const storageKeys = JSON.parse(localStorage.getItem(namespacedSilentStorageKey) || '{}') as Record<string, null>;
      storageKeys[key] = null;
      localStorage.setItem(namespacedSilentStorageKey, JSON.stringify(storageKeys));
    },
    get: (namespace: string) => {
      const namespacedSilentStorageKey = namespace + silentRequestStorageKey;
      const storageKeys = JSON.parse(localStorage.getItem(namespacedSilentStorageKey) || '{}') as Record<string, null>;
      let serializedMethod = undefined as SerializedMethod | undefined;
      let remove = noop;
      const keys = Object.keys(storageKeys);
      if (keys.length > 0) {
        const key = keys[0];
        const reqConfig = localStorage.getItem(key);
        serializedMethod = reqConfig ? JSON.parse(reqConfig) : undefined;
        remove = () => {
          delete storageKeys[key];
          localStorage.setItem(namespacedSilentStorageKey, JSON.stringify(storageKeys));
          localStorage.removeItem(key);
        };
      }
      return { serializedMethod, remove };
    },
  };
}