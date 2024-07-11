<script>
  import { useRequest } from 'alova/client';
  import { addFruit } from '../api/methods';
  import { showToast } from '../helper';

  let fruit = '';
  const fruitsList = [];
  const {
    loading: submiting,
    error,
    send
  } = useRequest(() => addFruit(fruit), {
    immediate: false
  }).onSuccess(({ data }) => {
    fruitsList.push(data.added);
    fruit = '';
  });

  const submitFruit = () => {
    if (!fruit) {
      showToast('Please input a fruit');
      return;
    }
    send();
  };
</script>

<div class="flex flex-col items-start">
  <div class="flex flex-row items-end">
    <!-- svelte-ignore invalid-binding -->
    <nord-input
      label="What is your favorite fruits?"
      value={fruit}
      on:input={({ target }) => (fruit = target.value)} />
    <nord-button
      class="ml-2"
      variant="primary"
      loading={$submiting || undefined}
      on:click={submitFruit}>
      Submit
    </nord-button>
  </div>
  {#if $error}
    <span class="text-red-500">{$error.message}</span>
  {/if}

  <div class="mt-4 grid grid-cols-[repeat(8,fit-content(100px))] gap-2">
    {#each fruitsList as item}
      <nord-badge variant="success">{item}</nord-badge>
    {/each}
  </div>
</div>
