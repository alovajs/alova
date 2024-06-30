import { onSilentSubmitError, onSilentSubmitFail, silentQueueMap } from 'alova/client';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { showToast } from '../helper';

const useWaitingSilentQueue = queueName => {
  const [waitingSilentQueue, setWaitingSilentQueue] = useState([]);
  useEffect(() => {
    // 修改队列为可监听的队列
    const customQueue = [];
    const originalPush = customQueue.push;
    const originalShift = customQueue.shift;
    customQueue.push = function (...items) {
      waitingSilentQueue.push(...items);
      setWaitingSilentQueue([...waitingSilentQueue]);
      return originalPush.call(this, ...items);
    };
    customQueue.shift = function () {
      const silentMethodInstance = originalShift.call(this);
      waitingSilentQueue.shift();
      setWaitingSilentQueue([...waitingSilentQueue]);
      return silentMethodInstance;
    };
    silentQueueMap[queueName] = customQueue;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return {
    queue: waitingSilentQueue,
    queueName
  };
};

function QueueConsole({ onModeChange }) {
  const [networkMode, setNetworkMode] = useState(0);
  const defaultWaitingSilentQueue = useWaitingSilentQueue('default');

  // 静默提交，多次重试后失败
  const [silentRequestError, setSilentRequestError] = useState('');
  useEffect(() => {
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
    onModeChange(networkMode);
    return () => {
      offSubmitError();
      offSubmitFail();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <nord-card>
      <label
        slot="header"
        className="text-lg font-bold mr-2">
        Network Mode
      </label>
      <nord-select
        slot="header-end"
        value={networkMode}
        hide-label
        onInput={({ target }) => {
          setNetworkMode(target.value);
          onModeChange(target.value);
        }}>
        <option value={0}>Silent Request</option>
        <option value={1}>Normal Request</option>
      </nord-select>
      <div className="border-b-[1px] last:border-b-0 pb-4 border-slate-200">
        {[defaultWaitingSilentQueue].map(({ queue, queueName }) => (
          <div key={queueName}>
            <div className="text-base font-semibold mb-2">[{queueName}] Request Queue</div>
            <div className="grid gap-y-4">
              {queue.map((sm, i) => (
                <div
                  key={sm.id}
                  className="border-2 border-slate-200 rounded-md px-3 py-2 flex items-center justify-between">
                  {!silentRequestError || i > 0 ? (
                    <div className="flex items-center">
                      <div className="mr-1">
                        {i > 0 ? <div className="bg-amber-400 w-2 h-2 rounded-lg"></div> : <nord-spinner />}
                      </div>
                      <span>{i > 0 ? 'waiting' : 'acting'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="text-red-600 mr-1">×</div>
                      Request Error
                    </div>
                  )}
                  <span>
                    [{sm.entity.type}]{sm.entity.url}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </nord-card>
  );
}
QueueConsole.propTypes = {
  onModeChange: PropTypes.func.isRequired
};
export default QueueConsole;
