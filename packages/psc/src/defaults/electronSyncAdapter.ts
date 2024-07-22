import { createPSCSynchronizer, createSyncAdapter } from '@/sharedCacheAdapter';
import type { IpcMain, IpcRenderer } from 'electron';

const EventName = {
  TO_MAIN: 'alova-ipc-to-main',
  TO_CLIENT: 'alova-ipc-to-client'
} as const;

/**
 * Use this function in payload.js/ts
 */
export function ElectronSyncAdapter(ipcRenderer: IpcRenderer) {
  return createSyncAdapter({
    send(event) {
      ipcRenderer.emit(EventName.TO_MAIN, event);
    },
    receive(handler) {
      ipcRenderer.on(EventName.TO_CLIENT, (_, payload) => handler(payload));
    }
  });
}

let hasSynchronizer = false;

/**
 * Use this function in main process.
 */
export function createElectronPSCSynchronizer(ipcMain: IpcMain) {
  if (hasSynchronizer) {
    return;
  }
  hasSynchronizer = true;

  createPSCSynchronizer(
    createSyncAdapter({
      send(event) {
        ipcMain.emit(EventName.TO_CLIENT, event);
      },
      receive(handler) {
        ipcMain.on(EventName.TO_MAIN, ({ sender }, payload) =>
          handler(payload, event => {
            sender.emit(EventName.TO_CLIENT, event);
          })
        );
      }
    })
  );
}
