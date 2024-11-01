import { useRetriableRequest } from 'alova/client';
import { createSignal, For } from 'solid-js';
import { getRetryData } from '../../api/methods';
import { formatDate } from '../../helper';

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

function RetriableRequest(props) {
  const { title, retry, backoff, apiErrorTimes: errTimes, stopManually } = retryTypes[props.id];
  const [retryMsgs, setRetryMsgs] = createSignal([]);
  const pushMsg = msg => {
    msg.content = `[${formatDate(new Date())}] ${msg.content}`;
    setRetryMsgs(prev => [...prev, msg]);
  };

  const ttt = useRetriableRequest(() => getRetryData({ id: props.id, errTimes }), {
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

  console.log(ttt);
  const { data, loading, error, send, stop } = ttt;

  const handleSend = () => {
    setRetryMsgs([]);
    send().catch(() => {});
  };

  return (
    <nord-card>
      <h3 slot="header">
        [{props.id}] {title}
      </h3>
      <div class="grid gap-y-4">
        <div class="flex justify-between">
          <nord-button
            variant="primary"
            loading={loading()}
            onClick={handleSend}>
            Start request
          </nord-button>
          {stopManually && loading() && <nord-button onClick={stop}>Stop manually</nord-button>}
        </div>

        {error() && (
          <nord-banner
            class="alert"
            variant="danger">
            <div class="flex flex-col">
              <strong>Error Info</strong>
            </div>
            <span>{error().message}</span>
          </nord-banner>
        )}
        {retryMsgs().length > 0 && (
          <nord-banner variant="warning">
            <div class="flex flex-col">
              <strong>Retry Info</strong>
            </div>
            <div class="flex flex-col leading-6">
              <For each={retryMsgs()}>{({ content, className }) => <span class={className}>{content}</span>}</For>
            </div>
          </nord-banner>
        )}
        {data() && (
          <nord-banner variant="success">
            <div class="flex flex-col">
              <strong>Request Success</strong>
            </div>
            <span>Response is: {JSON.stringify(data())}</span>
          </nord-banner>
        )}
      </div>
    </nord-card>
  );
}

export default RetriableRequest;
