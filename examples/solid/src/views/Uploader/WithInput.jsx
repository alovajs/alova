import { useUploader } from 'alova/client';
import { createSignal, For } from 'solid-js';
import { uploadFiles } from '../../api/methods';
import FileViewer from '../../components/FileViewer';
import { showToast } from '../../helper';

export default function WithInput(props) {
  const filePath = window.__page.source[2];
  const docPath = window.__page.doc;

  const [content, setContent] = createSignal('');
  const { fileList, upload, appendFiles, removeFiles, uploading } = useUploader(uploadFiles, {
    limit: 3
  });

  const statusText = status => ['wait upload', 'uploading...', 'upload success', 'upload fail'][status];

  const dataConverter = {
    file: () => new File([content()], 'test.txt'),
    blob: () => new Blob([content()], { type: 'text/plain' }),
    base64: () => content(),
    arraybuffer: () => {
      const encoder = new TextEncoder();
      return encoder.encode(content()).buffer;
    }
  };

  const handleAppendFiles = () => {
    const data = dataConverter[props.fileFormat.toLowerCase()]();
    showToast(`receive a file which is '${data.toString()}'`, {
      autoDismiss: 4000
    });
    appendFiles({
      file: data,
      name: data.name || 'file'
    });
  };

  return (
    <nord-card>
      <div slot="header">
        <FileViewer
          filePath={filePath}
          docPath={docPath}>
          <h3 class="title">Upload file of {props.fileFormat}</h3>
        </FileViewer>
      </div>
      <div class="grid gap-y-4">
        <nord-input
          label="Type something and auto transform to File while uploading"
          value={content()}
          onInput={({ target }) => setContent(target.value)}
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
        <div class="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-4">
          <nord-button
            variant="primary"
            onClick={handleAppendFiles}>
            Add File
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
