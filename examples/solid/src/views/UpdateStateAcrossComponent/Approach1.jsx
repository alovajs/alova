import { updateState, useRequest } from 'alova/client';
import { createSignal } from 'solid-js';
import { queryStudentDetail } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

function Approach1() {
  const { loading, error, data } = useRequest(queryStudentDetail(1), {
    initialData: {}
  });

  return (
    <>
      {loading() ? (
        <nord-spinner />
      ) : error() ? (
        <span class="text-red-500">{error.message}</span>
      ) : (
        <div>
          <nord-card>
            <div slot="header">
              <FileViewer
                filePath={window.__page.source[0]}
                docPath={window.__page.doc[0]}>
                <h3 class="title">update state by `updateState`</h3>
              </FileViewer>
            </div>
            <div class="grid gap-y-2 text-lg">
              <div>id: {data().id}</div>
              <div>name: {data().name}</div>
              <div>class: {data().cls}</div>
            </div>
            <div slot="footer">
              <EditCard />
            </div>
          </nord-card>
        </div>
      )}
    </>
  );
}
export default Approach1;

function EditCard() {
  const [name, setName] = createSignal('');
  const [cls, setCls] = createSignal('');

  const handleUpdateState = () => {
    // update state
    updateState(queryStudentDetail(1), oldData => {
      return {
        ...oldData,
        name: name(),
        cls: cls()
      };
    });
  };

  return (
    <div class="border-t-[1px] pt-4 border-slate-200 grid grid-rows-3 gap-y-4">
      <nord-input
        label="name"
        value={name()}
        onInput={({ target }) => setName(target.value)}
        expand
      />
      <nord-input
        label="class"
        value={cls()}
        onInput={({ target }) => setCls(target.value)}
        expand
      />

      <nord-button
        variant="primary"
        expand
        onClick={handleUpdateState}>
        Submit to update the above info
      </nord-button>
    </div>
  );
}
