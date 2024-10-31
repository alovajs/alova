import { onSilentSubmitError, onSilentSubmitFail, silentQueueMap } from 'alova/client';
import { createSignal, For, onCleanup, onMount } from 'solid-js';
import { showToast } from '../helper';

const useWaitingSilentQueue = queueName => {
  const [waitingSilentQueue, setWaitingSilentQueue] = createSignal([]);

  // 修改队列为可监听的队列
  const customQueue = [];
  const originalPush = customQueue.push;
  const originalShift = customQueue.shift;

  // eslint-disable-next-line
  customQueue.push = function (...items) {
    const updatedQueue = [...waitingSilentQueue(), ...items];
    setWaitingSilentQueue(updatedQueue);
    return originalPush.apply(this, items);
  };
  // eslint-disable-next-line
  customQueue.shift = function () {
    const silentMethodInstance = originalShift.call(this);
    setWaitingSilentQueue(waitingSilentQueue().slice(1));
    return silentMethodInstance;
  };

  silentQueueMap[queueName] = customQueue;

  return {
    queue: waitingSilentQueue,
    queueName
  };
};

function QueueConsole(props) {
  const [networkMode, setNetworkMode] = createSignal(0);
  const [silentRequestError, setSilentRequestError] = createSignal('');
  const defaultWaitingSilentQueue = useWaitingSilentQueue(props.queueName);

  // 静默提交，多次重试后失败
  onMount(() => {
    const offSubmitError = onSilentSubmitError(event => {
      console.error(event.error);
      showToast(
        `Request Error: ${event.error}` + (event.retryDelay ? `, ${event.retryDelay / 1000}s after will retry` : ''),
        {
          variant: 'error'
        }
      );
    });

    const offSubmitFail = onSilentSubmitFail(event => {
      setSilentRequestError(event.error);
      showToast('Reach max retry times, but you can still operate it', {
        variant: 'error'
      });
    });

    props.onModeChange(networkMode());

    // Cleanup on component unmount
    onCleanup(() => {
      offSubmitError();
      offSubmitFail();
    });
  });

  return (
    <nord-card>
      <label
        slot="header"
        class="text-lg font-bold mr-2">
        Network Mode
      </label>
      <nord-select
        slot="header-end"
        value={networkMode()}
        hide-label
        onInput={e => {
          const value = Number(e.target.value);
          setNetworkMode(value);
          props.onModeChange(value);
        }}>
        <option value={0}>Silent Request</option>
        <option value={1}>Normal Request</option>
      </nord-select>

      <div class="border-b-[1px] last:border-b-0 pb-4 border-slate-200">
        <For each={[defaultWaitingSilentQueue]}>
          {({ queue, queueName }) => (
            <div>
              <div class="text-base font-semibold mb-2">Background Request Queue[{queueName}]</div>
              <div class="grid gap-y-4">
                <For each={queue()}>
                  {(sm, i) => (
                    <div class="border-2 border-slate-200 rounded-md px-3 py-2 flex items-center justify-between">
                      {silentRequestError() === '' || i() > 0 ? (
                        <div class="flex items-center">
                          <div class="mr-1">
                            {i() > 0 ? <div class="bg-amber-400 w-2 h-2 rounded-lg" /> : <nord-spinner />}
                          </div>
                          <span>{i() > 0 ? 'waiting' : 'acting'}</span>
                        </div>
                      ) : (
                        <div class="flex items-center">
                          <div class="text-red-600 mr-1">×</div>
                          Request Error
                        </div>
                      )}
                      <span>
                        [{sm.entity.type}]{sm.entity.url}
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    </nord-card>
  );
}

export default QueueConsole;
