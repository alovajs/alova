import { useRequest } from 'alova/client';
import { For } from 'solid-js';
import { alova } from '../../api';
import { queryRandom } from '../../api/methods';
import FileViewer from '../../components/FileViewer';
import { showToast } from '../../helper';

const cacheKey = 'placeholder-cache';
function Approach1() {
  const methodOfQueryRandom = queryRandom();
  const {
    loading,
    error,
    data: randomNumbers
  } = useRequest(methodOfQueryRandom, {
    initialData() {
      const cache = alova.l2Cache.get(cacheKey);
      return cache || [];
    }
  }).onSuccess(({ data }) => {
    alova.l2Cache.set(cacheKey, data);
  });

  const handleClearCache = () => {
    alova.l2Cache.remove(cacheKey);
    showToast('Cache is cleared');
  };

  return (
    <nord-card>
      <div slot="header">
        <FileViewer
          filePath={window.__page.source[0]}
          docPath={window.__page.doc[0]}>
          <h3 class="title">Use `initialData` function</h3>
        </FileViewer>
      </div>
      <div class="grid gap-2 grid-cols-[fit-content(100px)_fit-content(100px)] mb-4">
        <nord-button onClick={() => location.reload()}>Reload page</nord-button>
        <nord-button onClick={handleClearCache}>Clear Cache</nord-button>
      </div>
      <Show
        when={!loading() || randomNumbers().length > 0}
        fallback={<nord-spinner />}>
        <div class="flex flex-row">
          <For each={randomNumbers()}>{num => <nord-badge class="mr-2">{num}</nord-badge>}</For>
        </div>
      </Show>
      <Show when={error()}>
        <span class="text-red-500">{error().message}</span>
      </Show>
    </nord-card>
  );
}

export default Approach1;
