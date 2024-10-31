import { useRequest } from 'alova/client';
import { For } from 'solid-js';
import { getData } from '../api/methods';

function View() {
  const { data, error, loading } = useRequest(getData, {
    initialValue: []
  });

  return (
    <>
      {loading() ? (
        <nord-spinner size="s" />
      ) : error() ? (
        <div>{error().message}</div>
      ) : (
        <div class="grid grid-cols-[repeat(8,fit-content(100px))] gap-2">
          <For each={data()}>
            {item => (
              <nord-badge
                class="mr-2"
                variant="success">
                {item}
              </nord-badge>
            )}
          </For>
        </div>
      )}
    </>
  );
}

export default View;
