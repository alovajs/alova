import { accessAction } from 'alova/client';
import { useState } from 'react';
import FileViewer from '../../components/FileViewer';

function Controller() {
  const [suffix, setSuffix] = useState('');
  const handleRefreshSideMenu = () => {
    accessAction('target:data', ({ send }) => send({ suffix }));
  };
  return (
    <nord-card>
      <div slot="header">
        <FileViewer
          showPath
          filePath="ActionDelegation/Controller">
          <h3 className="title">Controller Panel</h3>
        </FileViewer>
      </div>
      <div className="grid gap-y-4">
        <nord-banner>
          Input a suffix and click button, it will trigger the request in `Data Panel` component
        </nord-banner>
        <nord-input
          label="Suffix"
          value={suffix}
          onInput={({ target }) => setSuffix(target.value)}
        />
        <nord-button onClick={handleRefreshSideMenu}>Re-request with this suffix</nord-button>
      </div>
    </nord-card>
  );
}

export default Controller;
