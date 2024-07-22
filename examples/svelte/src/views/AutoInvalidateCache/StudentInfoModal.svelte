<script>
  import { useRequest } from 'alova/client';
  import { createEventDispatcher } from 'svelte';
  import { editStudent, queryStudentDetail } from '../../api/methods';

  export let id;
  let fromCache = false;
  const {
    loading,
    data: detail,
    update
  } = useRequest(queryStudentDetail(id), {
    initialData: {}
  }).onSuccess(event => {
    fromCache = event.fromCache;
  });

  const { loading: submiting, send: submit } = useRequest(() => editStudent($detail.name, $detail.cls, id), {
    immediate: false
  });

  const handleSubmit = async () => {
    await submit();
    dispatch('close', true);
  };
  const dispatch = createEventDispatcher();
</script>

<div>
  {#if $loading}
    <nord-spinner />
  {:else}
    <div class="grid gap-4 text-base">
      <nord-banner>From cache: {fromCache ? 'Yes' : 'No'}</nord-banner>
      <nord-input
        value={$detail.name}
        on:input={({ target }) => ($detail.name = target.value)}></nord-input>
      <nord-input
        label="class"
        value={$detail.cls}
        on:input={({ target }) => ($detail.cls = target.value)}></nord-input>
    </div>
  {/if}
</div>
<nord-button-group
  variant="spaced"
  class="mt-6">
  <nord-button
    on:click={() => dispatch('close')}
    expand
    id="cancelButton">Cancel</nord-button>
  <nord-button
    expand
    id="confirmButton"
    variant="primary"
    loading={$submiting || undefined}
    on:click={handleSubmit}>
    Save changes
  </nord-button>
</nord-button-group>
