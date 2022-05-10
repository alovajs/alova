export default function createLocalStorageSilentConfig() {
  return {
    push: (key: string, config: unknown) => {
      const silentRequestStorageKey = '__$$silentRequestStorageKey$$__';
      localStorage.setItem(key, JSON.stringify(config));
      const storageKeys = JSON.parse(localStorage.getItem(silentRequestStorageKey) || '[]');
      storageKeys.push(key);
      localStorage.setItem(silentRequestStorageKey, JSON.stringify(storageKeys));
    },
    pop: () => {
      const silentRequestStorageKey = '__$$silentRequestStorageKey$$__';
      const storageKeys = JSON.parse(localStorage.getItem(silentRequestStorageKey) || '[]');
      if (storageKeys.length > 0) {
        const key = storageKeys.shift();
        localStorage.setItem(silentRequestStorageKey, JSON.stringify(storageKeys));
        const reqConfig = localStorage.getItem(key);
        return reqConfig ? JSON.parse(reqConfig) : undefined;
      }
    }
  };
}