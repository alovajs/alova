<script>
  import { updateState } from 'alova/client';
  import { queryStudentDetail } from '../../api/methods';

  let name = '';
  let cls = '';

  const handleUpdateState = () => {
    // update state
    updateState(queryStudentDetail(1), oldData => {
      return {
        ...oldData,
        name,
        cls
      };
    });
  };
</script>

<div class="border-t-[1px] pt-4 border-slate-200 grid grid-rows-3 gap-y-4">
  <nord-input
    label="name"
    value={name}
    on:input={({ target }) => (name = target.value)}
    expand></nord-input>
  <nord-input
    label="class"
    value={cls}
    on:input={({ target }) => (cls = target.value)}
    expand></nord-input>

  <nord-button
    variant="primary"
    expand
    on:click={handleUpdateState}>
    Submit to update the above info
  </nord-button>
</div>
