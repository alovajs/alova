import { useSerialRequest } from 'alova/client';
import { useState } from 'react';
import { getData, submitForm } from '../api/methods';

function View() {
  const [msgs, setMsgs] = useState([]);
  const { loading, send } = useSerialRequest(
    [
      () => getData(),
      fruits => {
        setMsgs([`Request 1 success, Response is: ${JSON.stringify(fruits)}`]);
        return submitForm(fruits);
      }
    ],
    {
      immediate: false
    }
  ).onSuccess(({ data }) => {
    setMsgs([...msgs, `Request 2 success, Response is: ${JSON.stringify(data)}`]);
  });

  return (
    <nord-card>
      <div className="grid gap-y-4">
        <nord-button
          onClick={send}
          variant="primary"
          loading={loading || undefined}>
          Start serial request
        </nord-button>
        {msgs.length > 0 && (
          <nord-banner variant="warning">
            <div className="flex flex-col">
              <strong>Serial Request Info</strong>
            </div>
            <div className="flex flex-col leading-6">
              {msgs.map(msg => (
                <span key={msg}>{msg}</span>
              ))}
            </div>
          </nord-banner>
        )}
      </div>
    </nord-card>
  );
}
export default View;
