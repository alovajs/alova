import { useWatcher } from 'alova/client';
import { useState } from 'react';
import { queryStudents } from '../api/methods';
import { useEvent } from '../helper';

function View() {
  const [studentName, setStudentName] = useState('');
  const [clsName, setClsName] = useState();

  const { loading, data: students } = useWatcher(
    () => queryStudents(1, 10, studentName || '', clsName || ''),
    [studentName, clsName],
    {
      initialData: [],
      debounce: [500],
      immediate: true
    }
  );

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 10
    },
    {
      title: 'Class',
      dataIndex: 'cls',
      key: 'cls',
      width: 100
    }
  ];
  const { ref: inputRef } = useEvent({
    'sl-input'({ target }) {
      setStudentName(target.value);
    }
  });
  const { ref: selectRef } = useEvent({
    'sl-change'({ target }) {
      setClsName(target.value);
    }
  });
  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <sl-input
          class="mr-4"
          value={studentName}
          ref={inputRef}
          placeholder="Input student name"
          clearable
        />
        <sl-select
          class="mr-4"
          value={clsName}
          ref={selectRef}
          placeholder="Select class"
          clearable>
          <sl-option value="class1">class 1</sl-option>
          <sl-option value="class2">class 2</sl-option>
          <sl-option value="class3">class 3</sl-option>
        </sl-select>
        {loading ? <sl-spinner /> : null}
      </div>

      {JSON.stringify(students)}
    </div>
  );
}

export default View;
