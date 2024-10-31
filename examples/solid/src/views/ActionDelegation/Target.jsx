import { actionDelegationMiddleware, useRequest } from 'alova/client';
import { For } from 'solid-js';
import { getData } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

function Target() {
  const { data, loading, error } = useRequest(getData, {
    initialData: [],
    middleware: actionDelegationMiddleware('target:data')
  });

  const content = () => (
    <>
      {loading() ? (
        <nord-spinner size="s" />
      ) : error() ? (
        <div>{error().message}</div>
      ) : (
        <div class="grid grid-cols-[repeat(8,fit-content(100px))] gap-2">
          <For each={data()}>
            {item => (
              <nord-badge
                class="mr-2"
                variant="success">
                {item}
              </nord-badge>
            )}
          </For>
        </div>
      )}
    </>
  );

  return (
    <nord-card>
      <div slot="header">
        <FileViewer
          showPath
          filePath={window.__page.source[0]}
          docPath={window.__page.doc}>
          <h3 class="title">Data Panel</h3>
        </FileViewer>
      </div>
      {content()}
    </nord-card>
  );
}

export default Target;
