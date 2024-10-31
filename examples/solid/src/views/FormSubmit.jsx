import { useRequest } from 'alova/client';
import { createSignal, For } from 'solid-js';
import { addFruit } from '../api/methods';
import { showToast } from '../helper';

function View() {
  const [fruit, setFruit] = createSignal('');
  const [fruitsList, setFruitsList] = createSignal([]);
  const {
    loading: submiting,
    error,
    send
  } = useRequest(() => addFruit(fruit()), {
    immediate: false
  }).onSuccess(({ data }) => {
    setFruitsList(value => [...value, data.added]);
    setFruit('');
  });

  const submitFruit = () => {
    if (!fruit()) {
      showToast('Please input a fruit');
      return;
    }
    send();
  };

  return (
    <div class="flex flex-col items-start">
      <div class="flex flex-row items-end">
        <nord-input
          label="What is your favorite fruits?"
          value={fruit()}
          onInput={({ target }) => setFruit(target.value)}
        />
        <nord-button
          class="ml-2"
          variant="primary"
          p
          loading={submiting() || undefined}
          onClick={submitFruit}>
          Submit
        </nord-button>
      </div>
      {error ? <span class="text-red-500">{error.message}</span> : null}

      <div class="mt-4 grid grid-cols-[repeat(8,fit-content(100px))] gap-2">
        <For each={fruitsList()}>{item => <nord-badge variant="success">{item()}</nord-badge>}</For>
      </div>
    </div>
  );
}

export default View;
