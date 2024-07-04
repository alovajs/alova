import { useRequest } from 'alova/client';
import { useState } from 'react';
import { addFruit } from '../api/methods';
import { showToast } from '../helper';

function View() {
  const [fruit, setFruit] = useState('');
  const [fruitsList, setFruitsList] = useState([]);
  const {
    loading: submiting,
    error,
    send
  } = useRequest(() => addFruit(fruit), {
    immediate: false
  }).onSuccess(({ data }) => {
    setFruitsList([...fruitsList, data.added]);
    setFruit('');
  });

  const submitFruit = () => {
    if (!fruit) {
      showToast('Please input a fruit');
      return;
    }
    send();
  };

  return (
    <div className="flex flex-col items-start">
      <div className="flex flex-row items-end">
        <nord-input
          label="What is your favorite fruits?"
          value={fruit}
          onInput={({ target }) => setFruit(target.value)}></nord-input>
        <nord-button
          class="ml-2"
          variant="primary"
          loading={submiting || undefined}
          onClick={submitFruit}>
          Submit
        </nord-button>
      </div>
      {error ? <span className="text-red-500">{error.message}</span> : null}

      <div className="mt-4 grid grid-cols-[repeat(8,fit-content(100px))] gap-2">
        {fruitsList.map(item => (
          <nord-badge
            key={item}
            variant="success">
            {item}
          </nord-badge>
        ))}
      </div>
    </div>
  );
}

export default View;
