<div>
  <div role="status">{ $loading ? 'loading' : 'loaded' }</div>
  {#if !$loading}
    <div role="path">{$data.path}</div>
    <div role="id1">{$data.params.id1}</div>
    <div role="id2">{$data.params.id2}</div>
  {/if}
  <button role="btn1" on:click={handleClick1}>button1</button>
  <button role="btn2" on:click={handleClick2}>button2</button>
</div>

<script>
import { writable } from 'svelte/store';
import { createAlova, useWatcher } from '../../../src';
import GlobalFetch from '../../../src/predefine/GlobalFetch';
import SvelteHook from '../../../src/predefine/SvelteHook';
const stateId1 = writable(0);
const stateObj = writable({
  id: 10
});


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

const handleClick1 = () => {
  $stateId1++;
};
const handleClick2 = () => {
  $stateObj.id++;
}


const {
  loading,
  data,
  onSuccess,
} = useWatcher(() => getter($stateId1, $stateObj.id), [stateId1, stateObj], {
  initialData: {
    path: '',
    params: { id1: '', id2: '' }
  }
});
</script>