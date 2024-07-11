<script>
  import { useForm } from 'alova/client';
  import { getCityArea } from '../../api/methods';
  import FileViewer from '../../components/FileViewer.svelte';

  const filePath = window.__page.source[3];
  const docPath = window.__page.doc;
  const cityOptions = [
    { value: 'bj', label: '北京' },
    { value: 'sh', label: '上海' }
  ];

  /**
   * Confition filter form
   */
  const {
    form,
    send,
    updateForm,
    reset,
    data: areaList,
    loading: submiting
  } = useForm(getCityArea, {
    initialForm: {
      search: '',
      city: ''
    },
    initialData: [],
    immediate: true,
    store: true
  });

  const handleReset = () => {
    reset();
    setTimeout(send, 20);
  };
</script>

<nord-card>
  <div slot="header">
    <FileViewer
      {filePath}
      {docPath}>
      <h3 class="title">List condition search with storing</h3>
    </FileViewer>
  </div>
  <div class="grid lg:grid-cols-[repeat(3,auto)] items-end gap-4 mb-4">
    <nord-input
      label="Search Area"
      value={$form.search}
      on:input={({ target }) => ($form.search = target.value)}
      on:blur={send} />
    <nord-select
      label="Select City"
      value={$form.city}
      on:input={({ target }) => {
        $form.city = target.value;
        send();
      }}>
      {#each cityOptions as option}
        <option value={option.value}>
          {option.label}
        </option>
      {/each}
    </nord-select>
    <nord-button
      loading={$submiting || undefined}
      on:click={handleReset}>
      Reset
    </nord-button>
  </div>
  <div class="grid grid-cols-[repeat(auto-fill,60px)] gap-2">
    {#each $areaList as { label }}
      <nord-badge
        key={label}
        variant="info">
        {label}
      </nord-badge>
    {/each}
  </div>
</nord-card>
