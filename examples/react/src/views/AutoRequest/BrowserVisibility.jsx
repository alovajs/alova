import { useAutoRequest } from 'alova/client';
import { useState } from 'react';
import { getLatestTime } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

function BrowserVisibility() {
  const [isStop, setIsStop] = useState(false);
  const { loading, data } = useAutoRequest(getLatestTime, {
    enableNetwork: false,
    enableVisibility: true,
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
      <FileViewer filePath="AutoRequest/BrowserVisibility">
        <nord-banner variant="warning">minimize your browser, and then revert it</nord-banner>
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

export default BrowserVisibility;
