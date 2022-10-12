<div>
  <div role="status">{ $loading ? 'loading' : 'loaded' }</div>
  {#if !$loading}
    <div role="path">{$data.path}</div>
    <div role="id1">{$data.params.id1}</div>
    <div role="id2">{$data.params.id2}</div>
  {/if}
  <button on:click={handleClick}>button</button>
</div>

<script>
import { writable } from 'svelte/store';
import { createAlova, useWatcher } from '../../../src';
import GlobalFetch from '../../../src/predefine/GlobalFetch';
import SvelteHook from '../../../src/predefine/SvelteHook';
const stateId1 = writable(0);
const stateId2 = writable(10);


const alova = createAlova({
  baseURL: 'http://localhost:3000',
  timeout: 3000,
  statesHook: SvelteHook,
  requestAdapter: GlobalFetch(),
  responsed: response =>  response.json(),
});
const getter = (id1, id2) => alova.Get('/unit-test', {
  params: {
    id1,
    id2
  },
  transformData: ({ data }) => data,
});

const handleClick = () => {
  $stateId1++;
  $stateId2++;
};


const {
  loading,
  data,
  onSuccess,
} = useWatcher(() => getter($stateId1, $stateId2), [stateId1, stateId2], {
  initialData: {
    path: '',
    params: { id1: '', id2: '' }
  }
});
</script>