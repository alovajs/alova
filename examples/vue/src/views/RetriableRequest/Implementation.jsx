import { useRetriableRequest } from 'alova/client';
import PropTypes from 'prop-types';
import { useState } from 'react';
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
    title: 'Stop retring manually',
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

function RetriableRequest({ id }) {
  const { title, retry, backoff, apiErrorTimes: errTimes, stopManually } = retryTypes[id];
  const [retryMsgs, setRetryMsgs] = useState([]);
  const pushMsg = msg => {
    setRetryMsgs(prev => [...prev, `[${formatDate(new Date())}] ${msg}`]);
  };

  const { data, loading, error, send, stop } = useRetriableRequest(() => getRetryData({ id, errTimes }), {
    immediate: false,
    retry,
    backoff
  })
    .onError(() => {
      pushMsg('Request error, Waiting for next retry');
    })
    .onRetry(event => {
      const numSuffix = ['', 'st', 'nd', 'rd'];
      pushMsg(
        `Delayed ${event.retryDelay / 1000} seconds, in the ${event.retryTimes}${numSuffix[event.retryTimes] || 'th'} retring...`
      );
    })
    .onFail(event => {
      if (event.error.message.indexOf('manually') >= 0) {
        pushMsg('Stoped manually');
        return;
      }
      pushMsg(`Reached maximum retry times of ${event.retryTimes}, retry failed`);
    });

  const handleSend = () => {
    setRetryMsgs([]);
    send().catch(() => {});
  };

  return (
    <nord-card>
      <h3 slot="header">
        [{id}] {title}
      </h3>
      <div className="grid gap-y-4">
        <div className="flex justify-between">
          <nord-button
            variant="primary"
            loading={loading || undefined}
            onClick={handleSend}>
            Start request
          </nord-button>
          {stopManually && loading && <nord-button onClick={stop}>Stop manually</nord-button>}
        </div>

        {error && (
          <nord-banner
            className="alert"
            variant="danger">
            <div className="flex flex-col">
              <strong>Error Info</strong>
            </div>
            <span>{error.message}</span>
          </nord-banner>
        )}
        {retryMsgs.length > 0 && (
          <nord-banner variant="warning">
            <div className="flex flex-col">
              <strong>Retry Info</strong>
            </div>
            <div className="flex flex-col leading-6">
              {retryMsgs.map(msg => (
                <span key={msg}>{msg}</span>
              ))}
            </div>
          </nord-banner>
        )}
        {data && (
          <nord-banner variant="success">
            <div className="flex flex-col">
              <strong>Request Success</strong>
            </div>
            <span>Response is: {JSON.stringify(data)}</span>
          </nord-banner>
        )}
      </div>
    </nord-card>
  );
}
RetriableRequest.propTypes = {
  id: PropTypes.string.isRequired
};

export default RetriableRequest;
