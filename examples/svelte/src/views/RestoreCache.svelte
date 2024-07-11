<script>
  import { invalidateCache } from 'alova';
  import { useRequest } from 'alova/client';
  import { queryFestivals } from '../api/methods';

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
</script>

{#if $loading && $festivals.length <= 0}
  <nord-spinner />
{:else if $error}
  <span>{$error.message}</span>
{:else}
  <nord-card>
    <h3 slot="header">Festivals of This Year</h3>
    <nord-banner variant="warning">
      <div>
        <nord-button
          variant="plain"
          size="s"
          on:click={reloadPage}>
          Reload page
        </nord-button>
        <span>, you don't need to re-request festival data until next year.</span>
      </div>
      <div>
        <nord-button
          size="s"
          variant="plain"
          class="mt-2"
          on:click={invalidateOldData}>
          Invalidate the persistent data
        </nord-button>
        <span> and reload page, you can see 'Loading...' again.</span>
      </div>
    </nord-banner>
    <div class="grid grid-cols-6 gap-2 mt-4">
      {#each $festivals as fes (fes.name)}
        <nord-badge>
          [{fes.date}] {fes.name}
        </nord-badge>
      {/each}
    </div>
  </nord-card>
{/if}
