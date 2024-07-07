<script>
  import { useRequest } from 'alova/client';
  import { queryStudentDetail } from '../../api/methods';

  export let id;

  let fromCache = false;
  const { loading, data: detail } = useRequest(() => queryStudentDetail(id), {
    initialData: {}
  }).onSuccess(event => {
    fromCache = event.fromCache;
  });
</script>

<div>
  {#if $loading}
    <nord-spinner />
  {:else}
    <div class="grid gap-4 text-base">
      <nord-banner>
        From cache: {fromCache ? 'Yes' : 'No'}
      </nord-banner>
      <span>Name: {$detail.name}</span>
      <span>Class: {$detail.cls}</span>
    </div>
  {/if}
</div>
