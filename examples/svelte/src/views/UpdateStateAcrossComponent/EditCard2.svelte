<script>
  import { useFetcher, useRequest } from 'alova/client';
  import { editStudent, queryStudentDetail } from '../../api/methods';

  export let id;

  let name = '';
  let cls = '';

  const { loading: submiting, send } = useRequest(() => editStudent(name, cls, id), {
    immediate: false
  });

  const { loading: fetching, fetch } = useFetcher({ force: true });

  const handleRefetch = async () => {
    await send();
    fetch(queryStudentDetail(id));
  };
</script>

<div class="border-t-[1px] pt-4 border-slate-200 grid grid-rows-3 gap-y-4">
  <nord-input
    label="name"
    value={name}
    on:input={e => (name = e.target.value)}
    expand></nord-input>
  <nord-input
    label="class"
    value={cls}
    on:input={e => (cls = e.target.value)}
    expand></nord-input>

  <nord-button
    variant="primary"
    expand
    disabled={$submiting || $fetching}
    on:click={handleRefetch}>
    {#if $submiting}
      Submiting...
    {:else if $fetching}
      Fetching...
    {:else}
      Submit to update the above info
    {/if}
  </nord-button>
</div>
