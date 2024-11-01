import { accessAction } from 'alova/client';
import { createSignal } from 'solid-js';
import FileViewer from '../../components/FileViewer';

function Controller() {
  const [suffix, setSuffix] = createSignal('');

  const handleRefreshSideMenu = () => {
    accessAction('target:data', ({ send }) => send({ suffix: suffix() }));
  };

  return (
    <nord-card>
      <div slot="header">
        <FileViewer
          showPath
          filePath={window.__page.source[1]}
          docPath={window.__page.doc}>
          <h3 class="title">Controller Panel</h3>
        </FileViewer>
      </div>
      <div class="grid gap-y-4">
        <nord-banner>
          Input a suffix and click button, it will trigger the request in `Data Panel` component
        </nord-banner>
        <nord-input
          label="Suffix"
          value={suffix()}
          onInput={e => setSuffix(e.target.value)}
        />
        <nord-button onClick={handleRefreshSideMenu}>Re-request with this suffix</nord-button>
      </div>
    </nord-card>
  );
}

export default Controller;
