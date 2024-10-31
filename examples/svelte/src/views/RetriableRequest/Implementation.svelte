<script>
  import { useRetriableRequest } from 'alova/client';
  import { getRetryData } from '../../api/methods';
  import { formatDate } from '../../helper';

  export let id;

  const retryTypes = {
    a: {
      title: 'Success after retry 2 times',
      retry: 3,
      backoff: {
        delay: 1000,
        multiplier: 1,
        startQuiver: 0,
        endQuiver: 0
      },
      apiErrorTimes: 2,
      stopManually: false
    },
    b: {
      title: 'Still fail after reaching a maximum of 5 times',
      retry: 5,
      backoff: {
        delay: 1000,
        multiplier: 1,
        startQuiver: 0,
        endQuiver: 0
      },
      apiErrorTimes: 10000,
      stopManually: false
    },
    c: {
      title: 'Retry time increases sequentially',
      retry: 3,
      backoff: {
        delay: 1000,
        multiplier: 2,
        startQuiver: 0,
        endQuiver: 0
      },
      apiErrorTimes: 3,
      stopManually: false
    },
    d: {
      title: 'Increase random retry time',
      retry: 3,
      backoff: {
        delay: 1000,
        multiplier: 1,
        startQuiver: 0.3,
        endQuiver: 0.6
      },
      apiErrorTimes: 3,
      stopManually: false
    },
    e: {
      title: 'Stop retrying manually',
      retry: 10000,
      backoff: {
        delay: 2000,
        multiplier: 1,
        startQuiver: 0,
        endQuiver: 0
      },
      apiErrorTimes: 10000,
      stopManually: true
    }
  };
  const { title, retry, backoff, apiErrorTimes: errTimes, stopManually } = retryTypes[id];
  let retryMsgs = [];

  const pushMsg = msg => {
    msg.content = `[${formatDate(new Date())}] ${msg.content}`;
    retryMsgs = [...retryMsgs, msg];
  };

  const { data, loading, error, send, stop } = useRetriableRequest(() => getRetryData({ id, errTimes }), {
    immediate: false,
    retry,
    backoff
  })
    .onError(() => {
      pushMsg({
        className: 'text-red-500',
        content: 'Request error, waiting for next retry'
      });
    })
    .onRetry(event => {
      const numSuffix = ['', 'st', 'nd', 'rd'];
      pushMsg({
        content: `Delayed ${event.retryDelay / 1000} seconds, in the ${event.retryTimes}${numSuffix[event.retryTimes] || 'th'} retrying...`
      });
    })
    .onFail(event => {
      if (event.error.message.includes('manually')) {
        pushMsg({
          className: 'text-gray-500',
          content: 'Stoped manually'
        });
        return;
      }
      pushMsg({
        content: `Reached maximum retry times of ${event.retryTimes}, retry failed`
      });
    });

  const handleSend = () => {
    retryMsgs = [];
    send().catch(() => {});
  };
</script>

<nord-card>
  <h3 slot="header">[{id}] {title}</h3>
  <div class="grid gap-y-4">
    <div class="flex justify-between">
      <nord-button
        variant="primary"
        loading={$loading || undefined}
        on:click={handleSend}>
        Start request
      </nord-button>
      {#if stopManually && $loading}
        <nord-button on:click={stop}> Stop manually </nord-button>
      {/if}
    </div>

    {#if $error}
      <nord-banner
        class="alert"
        variant="danger">
        <div class="flex flex-col">
          <strong>Error Info</strong>
        </div>
        <span>{$error.message}</span>
      </nord-banner>
    {/if}

    {#if retryMsgs.length > 0}
      <nord-banner variant="warning">
        <div class="flex flex-col">
          <strong>Retry Info</strong>
        </div>
        <div class="flex flex-col leading-6">
          {#each retryMsgs as msg (msg.content)}
            <span class={msg.className}>{msg.content}</span>
          {/each}
        </div>
      </nord-banner>
    {/if}

    {#if $data}
      <nord-banner variant="success">
        <div class="flex flex-col">
          <strong>Request Success</strong>
        </div>
        <span>Response is: {JSON.stringify($data)}</span>
      </nord-banner>
    {/if}
  </div>
</nord-card>
