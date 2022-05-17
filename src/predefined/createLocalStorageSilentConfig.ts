const silentRequestStorageKey = '__$$silentRequestStorageKey$$__';
export default function createLocalStorageSilentConfig() {
  return {
    push: (key: string, config: Record<string, any>) => {
      localStorage.setItem(key, JSON.stringify(config));
      const storageKeys = JSON.parse(localStorage.getItem(silentRequestStorageKey) || '[]');
      storageKeys.push(key);
      localStorage.setItem(silentRequestStorageKey, JSON.stringify(storageKeys));
    },
    get: () => {
      const storageKeys = JSON.parse(localStorage.getItem(silentRequestStorageKey) || '[]');
      if (storageKeys.length > 0) {
        const key = storageKeys.shift();
        localStorage.setItem(silentRequestStorageKey, JSON.stringify(storageKeys));
        const reqConfig = localStorage.getItem(key);
        return reqConfig ? JSON.parse(reqConfig) as Record<string, any> : undefined;
      }
    },
    remove: (key: string) => {
      const storageKeys = JSON.parse(localStorage.getItem(silentRequestStorageKey) || '[]');
      const index = storageKeys.indexOf(key);
      if (index > -1) {
        storageKeys.splice(index, 1);
        localStorage.setItem(silentRequestStorageKey, JSON.stringify(storageKeys));
        localStorage.removeItem(key);
      }
    }
  };
}