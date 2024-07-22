<script>
  import { useRequest } from 'alova/client';
  import { getData } from '../api/methods';

  const { data, loading, error } = useRequest(getData, {
    initialData: []
  });
</script>

<div>
  {#if $loading}
    <nord-spinner size="s" />
  {:else if $error}
    <div>{$error.message}</div>
  {:else}
    <div class="grid grid-cols-[repeat(8,fit-content(100px))] gap-2">
      {#each $data as item}
        <nord-badge
          class="mr-2"
          variant="success">{item}</nord-badge>
      {/each}
    </div>
  {/if}
</div>
