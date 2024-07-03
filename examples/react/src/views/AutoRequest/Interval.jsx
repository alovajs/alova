import { useAutoRequest } from 'alova/client';
import { useState } from 'react';
import { getLatestTime } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

function Interval() {
  const [isStop, setIsStop] = useState(false);
  const { loading, data } = useAutoRequest(getLatestTime, {
    enableNetwork: false,
    enableVisibility: false,
    enableFocus: false,
    pollingTime: 3000,
    middleware(_, next) {
      if (isStop) {
        return;
      }
      next();
    }
  });

  return (
    <div className="grid gap-y-4">
      <FileViewer filePath="AutoRequest/Interval">
        <nord-banner>It will request every 3 seconds</nord-banner>
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

export default Interval;
