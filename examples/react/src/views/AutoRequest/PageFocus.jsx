import { useAutoRequest } from 'alova/client';
import { useState } from 'react';
import { getLatestTime } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

function PageFocus() {
  const [isStop, setIsStop] = useState(false);
  const { loading, data } = useAutoRequest(getLatestTime, {
    enableNetwork: false,
    enableVisibility: false,
    enableFocus: true,
    middleware(_, next) {
      if (isStop) {
        return;
      }
      next();
    }
  });

  return (
    <div className="grid gap-y-4">
      <FileViewer
        filePath={window.__page.source[3]}
        docPath={window.__page.doc}>
        <nord-banner variant="success">Toggle your browser page tabs</nord-banner>
      </FileViewer>
      <nord-button
        onClick={() => setIsStop(!isStop)}
        variant="primary">
        <nord-icon
          class="mr-2"
          name={isStop ? 'interface-play' : 'interface-pause'}></nord-icon>
        {isStop ? 'Start Request' : 'Stop Request'}
      </nord-button>
      <div className="flex">
        <span>Refresh Time: {data || '--'}</span>
        {loading ? <nord-spinner /> : null}
      </div>
    </div>
  );
}

export default PageFocus;
