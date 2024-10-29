<script>
  import { updateState, useRequest } from '@/index';
  import { createAlova } from 'alova';
  import GlobalFetch from 'alova/fetch';
  import SvelteHook from '@/statesHook/svelte';

  const alova = createAlova({
    baseURL: 'http://localhost:3000',
    timeout: 3000,
    statesHook: SvelteHook,
    requestAdapter: GlobalFetch(),
    responded: response => response.json()
  });
  const Get = alova.Get('/unit-test', {
    transform: ({ data }) => data
  });

  const handleUpdateState = () => {
    updateState(Get, rawData => {
      return {
        ...rawData,
        path: '/unit-test-updated'
      };
    });
  };

  const { loading, data } = useRequest(Get, {
    initialData: { path: '', method: '' }
  });
</script>

<div role="wrap">
  <span role="status">{$loading ? 'loading' : 'loaded'}</span>
  <span role="path">{$data.path}</span>
  <span role="method">{$data.method}</span>
  <button on:click={handleUpdateState}>update</button>
</div>
