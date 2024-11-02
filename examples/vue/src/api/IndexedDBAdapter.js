let count = 0;
export function createIndexedDBAdapter() {
  const objectStoreName = 'images';
  const dbVersion = 1;
  let dbInstance;
  const request = window.indexedDB.open(`MyTestDatabase${count++}`, dbVersion);
  request.onupgradeneeded = ({ target }) => {
    console.log('upgradene');
    dbInstance = target.result;
    dbInstance.createObjectStore(objectStoreName, {
      keyPath: 'key'
    });
  };
  request.onerror = () => {
    throw new Error('Database open fail');
  };
  request.onsuccess = ({ target }) => {
    dbInstance = target.result;
  };

  return {
    get(key) {
      const tx = dbInstance.transaction([objectStoreName]);
      const request = tx.objectStore(objectStoreName).get(key);
      return new Promise((resolve, reject) => {
        request.onerror = () => {
          reject('data add fail');
        };
        request.onsuccess = ({ target }) => {
          resolve(target.result?.value);
        };
      });
    },
    set(key, value) {
      const tx = dbInstance.transaction([objectStoreName], 'readwrite');
      const request = tx.objectStore(objectStoreName).add({
        key,
        value
      });
      return new Promise((resolve, reject) => {
        request.onerror = () => {
          reject('data add fail');
        };
        request.onsuccess = ({ result }) => {
          resolve(result);
        };
      });
    },
    remove(key) {
      const tx = dbInstance.transaction([objectStoreName], 'readwrite');
      const request = tx.objectStore(objectStoreName).delete(key);
      return new Promise((resolve, reject) => {
        request.onerror = () => {
          reject('data remove fail');
        };
        request.onsuccess = event => {
          resolve(event);
        };
      });
    },
    clear() {
      const tx = dbInstance.transaction([objectStoreName], 'readwrite');
      tx.objectStore(objectStoreName).clear();
      return new Promise((resolve, reject) => {
        tx.onerror = () => {
          reject('data clear fail');
        };
        tx.oncomplete = () => {
          resolve();
        };
      });
    }
  };
}
