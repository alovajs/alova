import { createSharedCacheSynchronizer, createSyncAdapter } from '@/defaults/sharedCacheAdapter';
import type { IpcMain, IpcRenderer } from 'electron';

/**
 * Use this function in payload.js/ts
 */
export function ElectronSyncAdapter(ipcRenderer: IpcRenderer) {
  return createSyncAdapter({
    send(event) {
      ipcRenderer.emit('alova-ipc-to-main', event);
    },
    receive(handler) {
      ipcRenderer.on('alova-ipc-to-client', ({ sender }, payload) => {
        handler(payload, event => {
          sender.emit('alova-ipc-to-main', event);
        });
      });
    }
  });
}

let hasSynchronizer = false;

/**
 * Use this function in main process.
 */
export function createElectronSharedCacheSynchronizer(ipcMain: IpcMain) {
  if (hasSynchronizer) {
    return;
  }
  hasSynchronizer = true;

  createSharedCacheSynchronizer(
    createSyncAdapter({
      send(event) {
        ipcMain.emit('alova-ipc-to-client', event);
      },
      receive(handler) {
        ipcMain.on('alova-ipc-to-main', ({ sender }, payload) =>
          handler(payload, event => {
            sender.emit('alova-ipc-to-client', event);
          })
        );
      }
    })
  );
}
