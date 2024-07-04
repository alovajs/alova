import { useRequest } from 'alova/client';
import { imagePlain } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

function Approach1() {
  const imageList = ['1.jpg', '2.jpg'];
  const {
    data,
    loading,
    error,
    send: showImage
  } = useRequest(fileName => imagePlain(fileName), {
    immediate: false
  });

  return (
    <nord-card>
      <div slot="header">
        <FileViewer
          filePath={window.__page.source[0]}
          docPath={window.__page.doc[0]}>
          <h3 className="title">Custom `l2Cache` adapter</h3>
        </FileViewer>
      </div>
      <div className="grid gap-y-2">
        <p>Please select an image</p>
        <nord-button-group>
          {imageList.map(img => (
            <nord-button
              key={img}
              onClick={() => showImage(img)}>
              {img}
            </nord-button>
          ))}
        </nord-button-group>

        {loading ? (
          <nord-spinner size="s" />
        ) : error ? (
          <span>{error.message}</span>
        ) : data ? (
          <img
            src={data}
            alt="Selected"
          />
        ) : null}
      </div>
    </nord-card>
  );
}
export default Approach1;
