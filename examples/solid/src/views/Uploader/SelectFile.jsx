import { useUploader } from 'alova/client';
import { createSignal, For } from 'solid-js';
import { uploadFiles } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

export default function SelectFile() {
  const acceptOptions = ['.jpg', '.png', '.xlsx'];
  const filePath = window.__page.source[0];
  const docPath = window.__page.doc;

  const [accept, setAccept] = createSignal([]);
  const [multiple, setMultiple] = createSignal(false);

  const { fileList, upload, appendFiles, removeFiles, uploading } = useUploader(uploadFiles, {
    limit: 3,
    localLink: true
  });

  const statusText = status => ['wait upload', 'uploading...', 'upload success', 'upload fail'][status];

  const handleAppendFiles = () => {
    appendFiles({
      accept: accept().join(),
      multiple: multiple()
    });
  };

  const handleToggleChange = ({ target }) => {
    setTimeout(() => {
      setMultiple(target.checked);
    });
  };

  const handleCheckboxChange = ({ target }) => {
    setTimeout(() => {
      if (target.checked) {
        setAccept([...accept(), target.value]);
      } else {
        setAccept(accept().filter(item => item !== target.value));
      }
    });
  };

  return (
    <nord-card>
      <div slot="header">
        <FileViewer
          filePath={filePath}
          docPath={docPath}>
          <h3 class="title">[Select File] open a native dialog</h3>
        </FileViewer>
      </div>
      <div class="grid gap-y-4">
        <div class="flex">
          <label class="mr-3">file format</label>
          <For each={acceptOptions}>
            {item => (
              <div class="mr-4">
                <nord-checkbox
                  label={item}
                  value={item}
                  checked={accept().includes(item) || undefined}
                  onInput={handleCheckboxChange}
                />
              </div>
            )}
          </For>
        </div>
        <nord-toggle
          checked={multiple() || undefined}
          label="select multiple files"
          onInput={handleToggleChange}
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
            Select File
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
