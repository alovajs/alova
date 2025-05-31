<script>
  import { useUploader } from 'alova/client';
  import { uploadFiles } from '../../api/methods';
  import FileViewer from '../../components/FileViewer.svelte';

  const acceptOptions = ['.jpg', '.png', '.xlsx'];
  const filePath = window.__page.source[0];
  const docPath = window.__page.doc;

  let accept = [];
  let multiple = false;

  const { fileList, upload, appendFiles, removeFiles, uploading } = useUploader(uploadFiles, {
    limit: 3,
    localLink: true
  });

  const statusText = status => ['wait upload', 'uploading...', 'upload success', 'upload fail'][status];

  const handleAppendFiles = () => {
    appendFiles({
      accept: accept.join(),
      multiple: multiple
    });
  };

  const handleToggleChange = event => {
    setTimeout(() => {
      multiple = event.target.checked;
    });
  };

  const handleCheckboxChange = event => {
    setTimeout(() => {
      if (event.target.checked) {
        accept = [...accept, event.target.value];
      } else {
        accept = accept.filter(item => item !== event.target.value);
      }
    });
  };
</script>

<nord-card>
  <div slot="header">
    <FileViewer
      {filePath}
      {docPath}>
      <h3 class="title">[Select File] open a native dialog</h3>
    </FileViewer>
  </div>
  <div class="grid gap-y-4">
    <div class="flex">
      <label
        class="mr-3"
        for="">file format</label>
      {#each acceptOptions as item}
        <nord-checkbox
          class="mr-4"
          label={item}
          value={item}
          checked={accept.includes(item) || undefined}
          on:input={handleCheckboxChange} />
      {/each}
    </div>
    <nord-toggle
      checked={multiple || undefined}
      label="select multiple files"
      on:input={handleToggleChange} />

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
        Select File
      </nord-button>
      <nord-button
        on:click={() => upload()}
        disabled={$uploading || undefined}>Do Upload</nord-button>
    </div>
  </div>
</nord-card>
