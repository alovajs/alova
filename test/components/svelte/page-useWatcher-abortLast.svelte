<script>
  import { createAlova, useWatcher } from '@/index';
  import GlobalFetch from '@/predefine/GlobalFetch';
  import SvelteHook from '@/predefine/SvelteHook';
  import { writable } from 'svelte/store';

  export let throwError = false;
  export let successFn;
  export let errorFn = () => {};

  /** @type {boolean|undefined} */
  export let abortLast = undefined;

  const stateId1 = writable(0);
  const stateObj = writable({
    id: 10
  });

  const alova = createAlova({
    baseURL: 'http://localhost:3000',
    statesHook: SvelteHook,
    requestAdapter: GlobalFetch(),
    responded: response => response.json()
  });
  const getter = (id1, id2) =>
    alova.Get($stateId1 === 1 ? '/unit-test-1s' : '/unit-test', {
      params: {
        id1,
        id2
      },
      transformData: ({ data }) => {
        if (throwError && data.path === '/unit-test-1s') {
          throw new Error('error');
        }
        return data;
      }
    });

  const handleClick = (n1, n2) => {
    $stateId1 = n1;
    $stateObj.id = n2;
  };

  const { loading, data, error, onSuccess, onError } = useWatcher(
    () => getter($stateId1, $stateObj.id),
    [stateId1, stateObj],
    {
      initialData: {
        path: '',
        params: { id1: '', id2: '' }
      },
      abortLast
    }
  );
  onSuccess(successFn);
  onError(errorFn);
</script>

<div>
  <div role="status">{$loading ? 'loading' : 'loaded'}</div>
  {#if !$loading}
    <div role="path">{$data.path}</div>
    <div role="error">{$error?.message || ''}</div>
    <div role="id1">{$data.params.id1}</div>
    <div role="id2">{$data.params.id2}</div>
  {/if}
  <button
    role="btn1"
    on:click={() => handleClick(1, 11)}>button1</button>
  <button
    role="btn2"
    on:click={() => handleClick(2, 12)}>button1</button>
</div>
