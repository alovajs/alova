<script>
  import { useSerialRequest } from 'alova/client';
  import { getData, submitForm } from '../api/methods';

  let msgs = [];
  const { loading, send } = useSerialRequest(
    [
      () => getData(),
      fruits => {
        msgs = [`Request 1 success, Response is: ${JSON.stringify(fruits)}`];
        return submitForm(fruits);
      }
    ],
    {
      immediate: false
    }
  ).onSuccess(({ data }) => {
    msgs = [...msgs, `Request 2 success, Response is: ${JSON.stringify(data)}`];
  });
</script>

<nord-card>
  <div class="grid gap-y-4">
    <nord-button
      on:click={send}
      variant="primary"
      loading={$loading || undefined}>
      Start serial request
    </nord-button>
    {#if msgs.length > 0}
      <nord-banner variant="warning">
        <div class="flex flex-col">
          <strong>Serial Request Info</strong>
        </div>
        <div class="flex flex-col leading-6">
          {#each msgs as msg (msg)}
            <span>{msg}</span>
          {/each}
        </div>
      </nord-banner>
    {/if}
  </div>
</nord-card>
