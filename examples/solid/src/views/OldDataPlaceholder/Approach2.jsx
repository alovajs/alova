import { useRequest } from 'alova/client';
import { For, Show } from 'solid-js';
import { alova } from '../../api';
import { queryRandom } from '../../api/methods';
import FileViewer from '../../components/FileViewer';
import { showToast } from '../../helper';

const cacheKey = 'placeholder-cache2';
function Approach2() {
  const methodOfQueryRandom = queryRandom();
  const {
    loading,
    error,
    data: randomNumbers
  } = useRequest(methodOfQueryRandom, {
    initialData: [],
    async middleware({ proxyStates, method }, next) {
      const { data } = proxyStates;
      const cache = method.context.l2Cache.get(cacheKey);
      if (cache) {
        data.v = cache;
      }
      const res = await next();
      method.context.l2Cache.set(cacheKey, res);
      return res;
    }
  });

  const handleClearCache = () => {
    alova.l2Cache.remove(cacheKey);
    showToast('Cache is cleared');
  };

  return (
    <nord-card>
      <div slot="header">
        <FileViewer
          filePath={window.__page.source[1]}
          docPath={window.__page.doc[1]}>
          <h3 class="title">Use `middleware`</h3>
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

export default Approach2;
