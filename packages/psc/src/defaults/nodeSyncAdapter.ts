import { createPSCSynchronizer, createSyncAdapter } from '@/sharedCacheAdapter';
import { QueueCallback, usePromise, uuid } from '@alova/shared';
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
  // Resolve when the IPC connection is established and the message handlers
  // are registered, so callers can wait before sending the first sync event.
  const { promise: readyPromise, resolve: resolveReady } = usePromise<void>();

  ipc.connectTo(id, () => {
    // `connectTo`'s callback fires once the client is connected, so the handlers
    // registered via the queue and the `ready` promise can be resolved here.
    queue.tryRunQueueCallback();
    resolveReady();
    ipc.of[id].on('disconnect', () => queue.setProcessingState(true));
    onConnect?.(() => ipc.disconnect(id));
  });

  // disconnect when the process is terminated.
  process.on('SIGTERM', () => ipc.disconnect(id));

  return createSyncAdapter({
    send(event) {
      queue.queueCallback(() => {
        ipc.of[id]?.emit(EventName.TO_MAIN, event);
      });
    },
    receive(handler) {
      queue.queueCallback(() => {
        ipc.of[id]?.on(EventName.TO_CLIENT, payload => handler(payload));
      });
    },
    // exposed for callers/tests to await connection readiness
    ready: readyPromise
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
  // `ipc.serve(cb)` triggers `cb` on the server's "start" event, i.e. after the
  // server is actually listening — so the synchronizer is ready before any client
  // (whose `send` is queued until its own `connect`) can emit an event.
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
  // Explicitly start the server. In this node-ipc version `serve()` alone does
  // not begin listening, so clients would never connect.
  ipc.server.start();

  process.on('SIGTERM', () => ipc.server.stop());

  return promise;
}
