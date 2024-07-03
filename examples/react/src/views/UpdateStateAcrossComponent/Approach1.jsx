import { updateState, useRequest } from 'alova/client';
import { useState } from 'react';
import { queryStudentDetail } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

function Approach1() {
  const { loading, error, data } = useRequest(queryStudentDetail(1), {
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
        filePath="UpdateStateAcrossComponent/Approach1"
        className="mb-4">
        <h3 className="title">update state by `updateState`</h3>
      </FileViewer>
      <nord-card>
        <div className="grid gap-y-2 text-lg">
          <div>id: {data.id}</div>
          <div>name: {data.name}</div>
          <div>class: {data.cls}</div>
        </div>
      </nord-card>
      <EditCard></EditCard>
    </div>
  );
}
export default Approach1;

function EditCard() {
  const [name, setName] = useState('');
  const [cls, setCls] = useState('');
  const handleUpdateState = () => {
    // update state
    updateState(queryStudentDetail(1), () => {
      return {
        name,
        cls
      };
    });
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
          onClick={handleUpdateState}>
          Submit
        </nord-button>
      </div>
    </nord-card>
  );
}
