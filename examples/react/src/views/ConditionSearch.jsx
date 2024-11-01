import { useWatcher } from 'alova/client';
import { useState } from 'react';
import { queryStudents } from '../api/methods';
import Table from '../components/Table';

function View() {
  const [studentName, setStudentName] = useState('');
  const [clsName, setClsName] = useState();

  const { loading, data: students } = useWatcher(
    () => queryStudents(1, 10, studentName || '', clsName || ''),
    [studentName, clsName],
    {
      initialData: {
        total: 0,
        list: []
      },
      debounce: [500],
      immediate: true
    }
  );

  return (
    <div className="grid gap-y-4">
      <div className="flex items-center">
        <nord-input
          class="mr-4"
          value={studentName}
          hide-label
          onInput={({ target }) => setStudentName(target.value)}
          placeholder="Input student name"
          clearable
        />
        <nord-select
          class="mr-4"
          value={clsName}
          hide-label
          onInput={({ target }) => setClsName(target.value)}
          placeholder="Select class">
          <option value="class1">class 1</option>
          <option value="class2">class 2</option>
          <option value="class3">class 3</option>
        </nord-select>
      </div>
      <Table
        loading={loading}
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
            width: 10
          },
          {
            title: 'Class',
            dataIndex: 'cls',
            width: 100
          }
        ]}
        data={students.list}></Table>
    </div>
  );
}

export default View;
