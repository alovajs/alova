<script>
  import { useUploader } from 'alova/client';
  import { uploadFiles } from '../../api/methods';
  import FileViewer from '../../components/FileViewer.svelte';
  import { showToast } from '../../helper';

  export let fileFormat; // Required prop

  const filePath = window.__page.source[2];
  const docPath = window.__page.doc;

  let content = '';
  const { fileList, upload, appendFiles, removeFiles, uploading } = useUploader(uploadFiles, {
    limit: 3
  });

  const statusText = status => ['wait upload', 'uploading...', 'upload success', 'upload fail'][status];

  const dataConverter = {
    file: () => new File([content], 'test.txt'),
    blob: () => new Blob([content], { type: 'text/plain' }),
    base64: () => content,
    arraybuffer: () => {
      const encoder = new TextEncoder();
      return encoder.encode(content).buffer;
    }
  };

  const handleAppendFiles = () => {
    const data = dataConverter[fileFormat.toLowerCase()]();
    showToast(`receive a file which is '${data.toString()}'`, {
      autoDismiss: 4000
    });
    appendFiles({
      file: data,
      name: data.name || 'file'
    });
  };
</script>

<nord-card>
  <div slot="header">
    <FileViewer
      {filePath}
      {docPath}>
      <h3 class="title">Upload file of {fileFormat}</h3>
    </FileViewer>
  </div>
  <div class="grid gap-y-4">
    <nord-input
      label="Type something and auto transform to File while uploading"
      value={content}
      on:input={({ target }) => (content = target.value)} />
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
    <div class="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-4">
      <nord-button
        variant="primary"
        on:click={handleAppendFiles}>
        Add File
      </nord-button>
      <nord-button
        on:click={() => upload()}
        disabled={$uploading || undefined}>
        Do Upload
      </nord-button>
    </div>
  </div>
</nord-card>
