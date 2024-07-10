<script>
  import { onSilentSubmitError, onSilentSubmitFail, silentQueueMap } from 'alova/client';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { showToast } from '../helper';

  export let queueName;
  let silentRequestError = '';
  let networkMode = 0;
  let waitingSilentQueue = { queue: [], queueName };

  const handleModeChange = event => {
    networkMode = Number(event.target.value);
    dispatch('modeChange', networkMode);
  };

  function useWaitingSilentQueue(queueName) {
    const customQueue = [];
    const originalPush = customQueue.push;
    const originalShift = customQueue.shift;
    customQueue.push = function (...items) {
      waitingSilentQueue.queue.push(...items);
      waitingSilentQueue = waitingSilentQueue;
      return originalPush.call(this, ...items);
    };
    customQueue.shift = function () {
      const silentMethodInstance = originalShift.call(this);
      waitingSilentQueue.queue.shift();
      waitingSilentQueue = waitingSilentQueue;
      return silentMethodInstance;
    };
    silentQueueMap[queueName] = customQueue;
  }
  useWaitingSilentQueue(queueName);

  let offSubmitError, offSubmitFail;
  onMount(() => {
    offSubmitError = onSilentSubmitError(event => {
      showToast(
        `Request Error: ${event.error}` + (event.retryDelay ? `, ${event.retryDelay / 1000}s after will retry` : ''),
        { variant: 'error' }
      );
    });

    offSubmitFail = onSilentSubmitFail(event => {
      silentRequestError = event.error;
      showToast('Reach max retry times, but you can still operate it', { variant: 'error' });
    });

    dispatch('modeChange', networkMode);
  });
  onDestroy(() => {
    offSubmitError();
    offSubmitFail();
  });
  const dispatch = createEventDispatcher();
</script>

<nord-card>
  <label
    slot="header"
    class="text-lg font-bold mr-2">Network Mode</label>
  <nord-select
    slot="header-end"
    value={networkMode}
    hide-label
    on:input={handleModeChange}>
    <option value="0">Silent Request</option>
    <option value="1">Normal Request</option>
  </nord-select>
  <div class="border-b-[1px] last:border-b-0 pb-4 border-slate-200">
    <div>
      <div class="text-base font-semibold mb-2">
        Background Request Queue[{waitingSilentQueue.queueName}]
      </div>
      <div class="grid gap-y-4">
        {#each waitingSilentQueue.queue as sm, i (sm.id)}
          <div class="border-2 border-slate-200 rounded-md px-3 py-2 flex items-center justify-between">
            {#if !silentRequestError || i > 0}
              <div class="flex items-center">
                <div class="mr-1">
                  {#if i > 0}
                    <div class="bg-amber-400 w-2 h-2 rounded-lg"></div>
                  {:else}
                    <nord-spinner />
                  {/if}
                </div>
                <span>{i > 0 ? 'waiting' : 'acting'}</span>
              </div>
            {:else}
              <div class="flex items-center">
                <div class="text-red-600 mr-1">×</div>
                Request Error
              </div>
            {/if}
            <span>[{sm.entity.type}]{sm.entity.url}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</nord-card>
