import { createPSCSynchronizer, createSyncAdapter } from '@/sharedCacheAdapter';
import { usePromise, uuid } from '@alova/shared/function';
import { QueueCallback } from '@alova/shared/queueCallback';
import { IPCModule as IPCModule_ } from '@node-ipc/node-ipc';
import type { IPC } from 'node-ipc';

// fix(type-issue): https://github.com/node-ipc/node-ipc/issues/4
const IPCModule = IPCModule_ as unknown as typeof IPC;

export const AlovaIPCID = 'alova-default-channel';

const EventName = {
  TO_MAIN: 'alova-ipc-to-main',
  TO_CLIENT: 'alova-ipc-to-client'
} as const;

function createIPC(id: string) {
  const ipc = new IPCModule();
  ipc.config = {
    ...ipc.config,
    appspace: 'alova.sharedCache',
    id,
    silent: true
  };

  return ipc;
}

/**
 * Use this adapter in the process that hold the alova instance.
 * Make sure the `id` is the same as the one set in the synchronizer
 */
export function NodeSyncAdapter(onConnect?: (stopFn: () => void) => void, id = AlovaIPCID) {
  const ipc = createIPC(`client-${uuid()}`);
  const queue = new QueueCallback(null, true);

  ipc.connectTo(id, () => {
    queue.tryRunQueueCallback();

    ipc.of[id].on('disconnect', () => queue.setProcessingState(true));
    ipc.of[id].on('connect', () => {
      onConnect?.(() => ipc.disconnect(id));
      queue.tryRunQueueCallback();
    });
  });

  // disconnect when the process is terminated.
  process.on('SIGTERM', () => ipc.disconnect(id));

  return createSyncAdapter({
    send(event) {
      queue.queueCallback(() => ipc.of[id]?.emit(EventName.TO_MAIN, event));
    },
    receive(handler) {
      queue.queueCallback(() => {
        ipc.of[id]?.on(EventName.TO_CLIENT, payload => handler(payload));
      });
    }
  });
}

/**
 * Use this function in main process.
 *
 * param `id` is a string id of the unix / Windows socket used internally.
 * In most cases, you don't need to specify it manually.
 * When running multiple synchronizers in main process, please assign `id` manually.
 * And make sure the ids are unique between synchronizers
 */
export async function createNodePSCSynchronizer(id = AlovaIPCID) {
  const ipc = createIPC(id);

  const { promise, resolve } = usePromise<() => void>();
  ipc.serve(() => {
    createPSCSynchronizer(
      createSyncAdapter({
        send(event) {
          ipc.server.broadcast(EventName.TO_CLIENT, event);
        },
        receive(handler) {
          ipc.server.on(EventName.TO_MAIN, (payload, socket) => {
            handler(payload, event => {
              ipc.server.emit(socket, EventName.TO_CLIENT, event);
            });
          });
        }
      })
    );
    resolve(() => ipc.server.stop());
  });

  ipc.server.start();
  process.on('SIGTERM', () => ipc.server.stop());

  return promise;
}
