import { useFetcher, useRequest } from 'alova/client';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { editStudent, queryStudentDetail } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

function Approach2() {
  const { loading, error, data } = useRequest(queryStudentDetail(2), {
    initialData: {}
  });

  if (loading) {
    return <nord-spinner />;
  }
  if (error) {
    return <span className="text-red-500">{error.message}</span>;
  }
  return (
    <div>
      <FileViewer
        filePath="UpdateStateAcrossComponent/Approach2"
        className="mb-4">
        <h3 className="title">update state by `useFetcher`</h3>
      </FileViewer>
      <nord-card>
        <div className="grid gap-y-2 text-lg">
          <div>id: {data.id}</div>
          <div>name: {data.name}</div>
          <div>class: {data.cls}</div>
        </div>
      </nord-card>
      <EditCard id={data.id}></EditCard>
    </div>
  );
}
export default Approach2;

function EditCard({ id }) {
  const [name, setName] = useState('');
  const [cls, setCls] = useState('');
  const { loading: submiting, send } = useRequest(() => editStudent(name, cls, id), {
    immediate: false
  });
  const { loading: fetching, fetch } = useFetcher({ force: true });
  const handleRefetch = async () => {
    await send();
    fetch(queryStudentDetail(id));
  };

  return (
    <nord-card class="mt-4">
      <h1 slot="header">Update The Above Info</h1>
      <div className="grid grid-rows-3 gap-y-4">
        <nord-input
          label="name"
          value={name}
          onInput={({ target }) => setName(target.value)}
          expand></nord-input>
        <nord-input
          label="class"
          value={cls}
          onInput={({ target }) => setCls(target.value)}
          expand></nord-input>

        <nord-button
          variant="primary"
          expand
          disabled={submiting || fetching || undefined}
          onClick={handleRefetch}>
          {submiting ? 'Submiting...' : fetching ? 'fetching...' : 'Submit'}
        </nord-button>
      </div>
    </nord-card>
  );
}
EditCard.propTypes = {
  id: PropTypes.number.isRequired
};
