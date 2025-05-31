import { useUploader } from 'alova/client';
import { For, onMount } from 'solid-js';
import { uploadFiles } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

export default function Canvas() {
  const filePath = window.__page.source[1];
  const docPath = window.__page.doc;
  let canvasRef;

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
    ctx.fillStyle =
      '#' +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0');
    ctx.fillRect(Math.floor(Math.random() * 170), Math.floor(Math.random() * 170), 30, 30);
  };

  onMount(() => {
    handleRandomDraw();
  });

  return (
    <nord-card>
      <div slot="header">
        <FileViewer
          filePath={filePath}
          docPath={docPath}>
          <h3 class="title">Upload canvas as image</h3>
        </FileViewer>
      </div>
      <div class="grid gap-y-4">
        <canvas
          ref={canvasRef}
          width="200"
          height="200"
        />
        <div class="flex">
          <For each={fileList()}>
            {file => (
              <div class="relative mr-2">
                <div class="absolute top-2 right-2 cursor-pointer">
                  <nord-icon
                    name="interface-close"
                    onClick={() => removeFiles(file)}
                  />
                </div>
                <img
                  class="w-32"
                  src={file.src}
                  alt="preview"
                />
                <div>{file.progress.uploaded + '/' + file.progress.total}</div>
                <div>{statusText(file.status)}</div>
              </div>
            )}
          </For>
        </div>
        <div class="grid grid-cols-[repeat(3,fit-content(100px))] gap-x-4">
          <nord-button
            onClick={handleRandomDraw}
            variant="dashed">
            Random Draw
          </nord-button>
          <nord-button
            variant="primary"
            onClick={handleAppendFiles}>
            Add Canvas
          </nord-button>
          <nord-button
            onClick={() => upload()}
            disabled={uploading() || undefined}>
            Do Upload
          </nord-button>
        </div>
      </div>
    </nord-card>
  );
}
