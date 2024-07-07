<script>
  import { useRequest } from 'alova/client';
  import { createEventDispatcher } from 'svelte';
  import { editStudent, queryStudentDetail } from '../../api/methods';

  export let id = undefined;

  const dispatch = createEventDispatcher();

  const { loading, data: detail } = useRequest(() => queryStudentDetail(id), {
    initialData: {
      name: 'newName',
      cls: 'class1'
    },
    immediate: !!id
  });

  const { loading: submitting, send: sendStudentAdd } = useRequest(() => editStudent($detail.name, $detail.cls, id), {
    immediate: false
  });

  const submitStudent = async () => {
    if (!$detail.name) {
      alert('Please input student name');
      return;
    }
    const newId = await sendStudentAdd();
    dispatch('submit', {
      ...$detail,
      id: newId || $detail.id
    });
  };

  const classOptions = [
    {
      title: 'class 1',
      value: 'class1'
    },
    {
      title: 'class 2',
      value: 'class2'
    },
    {
      title: 'class 3',
      value: 'class3'
    }
  ];
</script>

{#if $loading}
  <div>
    <nord-spinner />
  </div>
{:else}
  <div class="grid gap-y-4">
    <nord-input
      label="Name"
      value={$detail.name}
      on:input={({ target }) => ($detail.name = target.value)} />
    <nord-select
      label="Class"
      value={$detail.cls}
      on:input={({ target }) => ($detail.cls = target.value)}>
      {#each classOptions as option}
        <option value={option.value}>
          {option.title}
        </option>
      {/each}
    </nord-select>
    <nord-button
      variant="primary"
      on:click={submitStudent}
      loading={$submitting || undefined}>
      Submit
    </nord-button>
  </div>
{/if}
