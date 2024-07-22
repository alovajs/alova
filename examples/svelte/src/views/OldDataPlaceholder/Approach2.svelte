<script>
  import { useRequest } from 'alova/client';
  import { alova } from '../../api';
  import { queryRandom } from '../../api/methods';
  import FileViewer from '../../components/FileViewer';
  import { showToast } from '../../helper';

  const cacheKey = 'placeholder-cache2';
  const filePath = window.__page.source[1];
  const docPath = window.__page.doc[1];
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

  function handleReload() {
    location.reload();
  }

  function handleClearCache() {
    alova.l2Cache.remove(cacheKey);
    showToast('Cache is cleared');
  }
</script>

{#if $loading && $randomNumbers.length <= 0}
  <nord-spinner />
{:else if $error}
  <span class="text-red-500">{$error.message}</span>
{:else}
  <nord-card>
    <div slot="header">
      <FileViewer
        {filePath}
        {docPath}>
        <h3 class="title">Use `middleware`</h3>
      </FileViewer>
    </div>
    <div class="grid gap-2 grid-cols-[fit-content(100px)_fit-content(100px)] mb-4">
      <nord-button on:click={handleReload}>Reload page</nord-button>
      <nord-button on:click={handleClearCache}>Clear Cache</nord-button>
    </div>
    <div class="flex flex-row">
      {#each $randomNumbers as num}
        <nord-badge class="mr-2">{num}</nord-badge>
      {/each}
    </div>
  </nord-card>
{/if}
