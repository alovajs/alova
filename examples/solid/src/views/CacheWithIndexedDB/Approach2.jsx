import { useRequest } from 'alova/client';
import { For } from 'solid-js';
import { imageWithControlledCache } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

function Approach2() {
  const imageList = ['1.jpg', '2.jpg'];
  const {
    data,
    loading,
    error,
    send: showImage
  } = useRequest(fileName => imageWithControlledCache(fileName), {
    immediate: false
  });

  return (
    <nord-card>
      <div slot="header">
        <FileViewer
          filePath={window.__page.source[1]}
          docPath={window.__page.doc[1]}>
          <h3 class="title">Controlled cache</h3>
        </FileViewer>
      </div>
      <div class="grid gap-y-2">
        <p>Please select an image</p>
        <nord-button-group>
          <For each={imageList}>{img => <nord-button onClick={() => showImage(img)}>{img}</nord-button>}</For>
        </nord-button-group>

        {loading() ? (
          <nord-spinner size="s" />
        ) : error() ? (
          <span>{error.message}</span>
        ) : data() ? (
          <img
            src={data()}
            alt="Selected"
          />
        ) : null}
      </div>
    </nord-card>
  );
}
export default Approach2;
