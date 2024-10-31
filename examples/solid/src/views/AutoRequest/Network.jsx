import { useAutoRequest } from 'alova/client';
import { createSignal } from 'solid-js';
import { getLatestTime } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

function Network() {
  const [isStop, setIsStop] = createSignal(false);
  const { loading, data } = useAutoRequest(getLatestTime, {
    enableNetwork: true,
    enableVisibility: false,
    enableFocus: false,
    middleware(_, next) {
      if (isStop()) {
        return;
      }
      next();
    }
  });

  return (
    <div class="grid gap-y-4">
      <FileViewer
        filePath={window.__page.source[2]}
        docPath={window.__page.doc}>
        <nord-banner variant="warning">Minimize your browser, then revert it</nord-banner>
      </FileViewer>
      <nord-button
        onClick={() => setIsStop(!isStop())}
        variant="primary">
        <nord-icon
          class="mr-2"
          name={isStop() ? 'interface-play' : 'interface-pause'}
        />
        {isStop() ? 'Start Request' : 'Stop Request'}
      </nord-button>
      <div class="flex">
        <span>Refresh Time: {data() || '--'}</span>
        {loading() ? <nord-spinner /> : null}
      </div>
    </div>
  );
}

export default Network;
