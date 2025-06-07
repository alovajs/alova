<script>
  import { useUploader } from 'alova/client';
  import { onMount } from 'svelte';
  import { uploadFiles } from '../../api/methods';
  import FileViewer from '../../components/FileViewer.svelte';

  let canvasRef;
  const filePath = window.__page.source[1];
  const docPath = window.__page.doc;

  const { fileList, upload, appendFiles, removeFiles, uploading } = useUploader(uploadFiles, {
    limit: 3,
    localLink: true
  });

  const statusText = status => ['wait upload', 'uploading...', 'upload success', 'upload fail'][status];

  const handleAppendFiles = () => {
    appendFiles({
      file: canvasRef
    });
  };

  const handleRandomDraw = () => {
    const ctx = canvasRef.getContext('2d');
    ctx.fillStyle = '#eee';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#' + Math.floor(Math.random() * 16777215).toString(16);
    ctx.fillRect(Math.floor(Math.random() * 200), Math.floor(Math.random() * 200), 30, 30);
  };

  onMount(handleRandomDraw);
</script>

<nord-card>
  <div slot="header">
    <FileViewer
      {filePath}
      {docPath}>
      <h3 class="title">Upload canvas as image</h3>
    </FileViewer>
  </div>
  <div class="grid gap-y-4">
    <canvas
      width="200"
      height="200"
      bind:this={canvasRef}></canvas>
    <div class="flex">
      {#each $fileList as file, index}
        <div class="relative mr-2">
          <nord-icon
            name="interface-close"
            class="absolute top-2 right-2 cursor-pointer"
            on:click={() => removeFiles(file)} />
          <img
            class="w-32"
            src={file.src} />
          <div>{file.progress.uploaded}/{file.progress.total}</div>
          <div>{statusText(file.status)}</div>
        </div>
      {/each}
    </div>
    <div class="grid grid-cols-[repeat(3,fit-content(100px))] gap-x-4">
      <nord-button
        on:click={handleRandomDraw}
        variant="dashed">Random Draw</nord-button>
      <nord-button
        variant="primary"
        on:click={handleAppendFiles}>Add Canvas</nord-button>
      <nord-button
        on:click={() => upload()}
        disabled={$uploading || undefined}>Do Upload</nord-button>
    </div>
  </div>
</nord-card>
