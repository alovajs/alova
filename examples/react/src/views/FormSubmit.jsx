import { useRequest } from 'alova/client';
import { useState } from 'react';
import { addFruit } from '../api/methods';
import { useEvent } from '../helper';

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

  const { ref: inputRef } = useEvent({
    'sl-input'({ target }) {
      setFruit(target.value);
    }
  });
  const submitFruit = () => {
    if (!fruit) {
      alert('Please input a fruit');
      return;
    }
    send();
  };

  return (
    <div>
      <div className="flex flex-row items-end">
        <sl-input
          label="What is your favorite fruits?"
          value={fruit}
          ref={inputRef}></sl-input>
        <sl-button
          class="ml-2"
          variant="primary"
          loading={submiting || undefined}
          onClick={submitFruit}>
          Submit
        </sl-button>
      </div>
      {error ? <span className="text-red-500">{error.message}</span> : null}

      <div className="flex flex-row mt-4">
        {fruitsList.map(item => (
          <sl-badge
            key={item}
            variant="primary">
            {item}
          </sl-badge>
        ))}
      </div>
    </div>
  );
}

export default View;
