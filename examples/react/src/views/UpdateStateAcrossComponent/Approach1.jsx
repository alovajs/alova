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
      <nord-card>
        <div slot="header">
          <FileViewer filePath="UpdateStateAcrossComponent/Approach1">
            <h3 className="title">update state by `updateState`</h3>
          </FileViewer>
        </div>
        <div className="grid gap-y-2 text-lg">
          <div>id: {data.id}</div>
          <div>name: {data.name}</div>
          <div>class: {data.cls}</div>
        </div>
        <div slot="footer">
          <EditCard></EditCard>
        </div>
      </nord-card>
    </div>
  );
}
export default Approach1;

function EditCard() {
  const [name, setName] = useState('');
  const [cls, setCls] = useState('');
  const handleUpdateState = () => {
    // update state
    updateState(queryStudentDetail(1), oldData => {
      return {
        ...oldData,
        name,
        cls
      };
    });
  };

  return (
    <div className="border-t-[1px] pt-4 border-slate-200 grid grid-rows-3 gap-y-4">
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
        Submit to update the above info
      </nord-button>
    </div>
  );
}
