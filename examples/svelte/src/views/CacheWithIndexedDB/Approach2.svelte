<script>
  import { useRequest } from 'alova/client';
  import { imageWithControlledCache } from '../../api/methods';
  import FileViewer from '../../components/FileViewer.svelte';

  const imageList = ['1.jpg', '2.jpg'];
  const filePath = window.__page.source[0];
  const docPath = window.__page.doc[0];

  const {
    data,
    loading,
    error,
    send: showImage
  } = useRequest(fileName => imageWithControlledCache(fileName), {
    immediate: false
  });
</script>

<nord-card>
  <div slot="header">
    <FileViewer
      {filePath}
      {docPath}>
      <h3 class="title">Custom `l2Cache` adapter</h3>
    </FileViewer>
  </div>
  <div class="grid gap-y-2">
    <p>Please select an image</p>
    <nord-button-group>
      {#each imageList as img}
        <nord-button on:click={() => showImage(img)}>
          {img}
        </nord-button>
      {/each}
    </nord-button-group>
    {#if $loading}
      <nord-spinner size="s" />
    {:else if $error}
      <span>{$error.message}</span>
    {:else if $data}
      <img
        src={$data}
        alt="Selected" />
    {/if}
  </div>
</nord-card>
