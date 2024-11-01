import { useSerialRequest } from 'alova/client';
import { For, createSignal } from 'solid-js';
import { getData, submitForm } from '../api/methods';

function View() {
  const [msgs, setMsgs] = createSignal([]);
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
    setMsgs([...msgs(), `Request 2 success, Response is: ${JSON.stringify(data)}`]);
  });

  return (
    <nord-card>
      <div class="grid gap-y-4">
        <nord-button
          onClick={send}
          variant="primary"
          loading={loading() || undefined}>
          Start serial request
        </nord-button>
        {msgs().length > 0 && (
          <nord-banner variant="warning">
            <div class="flex flex-col">
              <strong>Serial Request Info</strong>
            </div>
            <div class="flex flex-col leading-6">
              <For each={msgs()}>{msg => <span>{msg}</span>}</For>
            </div>
          </nord-banner>
        )}
      </div>
    </nord-card>
  );
}

export default View;
