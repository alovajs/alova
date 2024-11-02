import { invalidateCache } from 'alova';
import { useRequest } from 'alova/client';
import { For } from 'solid-js';
import { queryFestivals } from '../api/methods';

function View() {
  const {
    loading,
    error,
    data: festivals
  } = useRequest(queryFestivals(), {
    initialData: []
  });

  const reloadPage = () => {
    location.reload();
  };

  const invalidateOldData = () => {
    invalidateCache(queryFestivals());
    reloadPage();
  };

  return (
    <>
      {loading() && festivals().length <= 0 ? (
        <nord-spinner />
      ) : error() ? (
        <span>{error().message}</span>
      ) : (
        <nord-card>
          <h3 slot="header">Festivals of This Year</h3>
          <nord-banner variant="warning">
            <div>
              <nord-button
                variant="plain"
                size="s"
                onClick={reloadPage}>
                Reload page
              </nord-button>
              <span>, you don&apos;t need to re-request festival data until next year.</span>
            </div>
            <div>
              <nord-button
                size="s"
                variant="plain"
                class="mt-2"
                onClick={invalidateOldData}>
                Invalidate the persistent data
              </nord-button>
              <span> and reload page, you can see &apos;Loading...&apos; again.</span>
            </div>
          </nord-banner>
          <div class="grid grid-cols-6 gap-2 mt-4">
            <For each={festivals()}>
              {fes => (
                <nord-badge>
                  [{fes.date}] {fes.name}
                </nord-badge>
              )}
            </For>
          </div>
        </nord-card>
      )}
    </>
  );
}

export default View;
