import { useFetcher, useRequest } from 'alova/client';
import { createSignal } from 'solid-js';
import { editStudent, queryStudentDetail } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

function Approach2() {
  const { loading, error, data } = useRequest(queryStudentDetail(2), {
    initialData: {}
  });

  return (
    <>
      {loading() ? (
        <nord-spinner />
      ) : error() ? (
        <span class="text-red-500">{error.message}</span>
      ) : (
        <nord-card>
          <div slot="header">
            <FileViewer
              filePath={window.__page.source[1]}
              docPath={window.__page.doc[1]}>
              <h3 class="title">update state by `useFetcher`</h3>
            </FileViewer>
          </div>
          <div class="grid gap-y-2 text-lg">
            <div>id: {data().id}</div>
            <div>name: {data().name}</div>
            <div>class: {data().cls}</div>
          </div>
          <div slot="footer">
            <EditCard id={data().id} />
          </div>
        </nord-card>
      )}
    </>
  );
}
export default Approach2;

function EditCard(props) {
  const [name, setName] = createSignal('');
  const [cls, setCls] = createSignal('');
  const { loading: submiting, send } = useRequest(() => editStudent(name(), cls(), props.id), {
    immediate: false
  });
  const { loading: fetching, fetch } = useFetcher({ force: true });

  const handleRefetch = async () => {
    await send();
    fetch(queryStudentDetail(props.id));
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
        disabled={submiting || fetching || undefined}
        onClick={handleRefetch}>
        {submiting ? 'Submiting...' : fetching ? 'Fetching...' : 'Submit to update the above info'}
      </nord-button>
    </div>
  );
}
