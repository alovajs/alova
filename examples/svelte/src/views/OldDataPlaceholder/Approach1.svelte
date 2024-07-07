<script>
  import { useRequest } from 'alova/client';
  import { alova } from '../../api';
  import { queryRandom } from '../../api/methods';
  import FileViewer from '../../components/FileViewer';
  import { showToast } from '../../helper';

  const filePath = window.__page.source[0];
  const docPath = window.__page.doc[0];
  const cacheKey = 'placeholder-cache';
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
        <h3 class="title">Use `initialData` function</h3>
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
