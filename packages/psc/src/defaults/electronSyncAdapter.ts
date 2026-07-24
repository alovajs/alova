import { createPSCSynchronizer, createSyncAdapter } from '@/sharedCacheAdapter';

/**
 * Minimal type definitions for the Electron IPC APIs used by this adapter.
 * They are declared locally to avoid depending on the `electron` package at
 * runtime/build time since it is only used for its type information.
 */
export interface IpcRenderer {
  on(channel: string, listener: (event: unknown, ...args: any[]) => void): void;
  emit(channel: string, ...args: any[]): void;
}

export interface IpcMainEvent {
  sender: {
    emit(channel: string, ...args: any[]): void;
  };
}

export interface IpcMain {
  on(channel: string, listener: (event: IpcMainEvent, ...args: any[]) => void): void;
  emit(channel: string, ...args: any[]): void;
}

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
