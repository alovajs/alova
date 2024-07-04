import { useAutoRequest } from 'alova/client';
import { useState } from 'react';
import { getLatestTime } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

function Network() {
  const [isStop, setIsStop] = useState(false);
  const { loading, data } = useAutoRequest(getLatestTime, {
    enableNetwork: true,
    enableVisibility: false,
    enableFocus: false,
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
        filePath={window.__page.source[1]}
        docPath={window.__page.doc}>
        <nord-banner variant="danger">Try to toggle your network</nord-banner>
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

export default Network;
