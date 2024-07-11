<script>
  import { useWatcher } from 'alova/client';
  import { writable } from 'svelte/store';
  import { queryStudents } from '../api/methods';
  import Table from '../components/Table.svelte';

  const studentName = writable('');
  const clsName = writable('');
  const columns = [
    { title: 'Name', dataIndex: 'name', width: 10 },
    { title: 'Class', dataIndex: 'cls', width: 100 }
  ];

  const { loading, data: students } = useWatcher(
    () => queryStudents(1, 10, $studentName || '', $clsName || ''),
    [studentName, clsName],
    {
      initialData: { total: 0, list: [] },
      debounce: [500],
      immediate: true
    }
  );
</script>

<div class="grid gap-y-4">
  <div class="flex items-center">
    <nord-input
      class="mr-4"
      value={$studentName}
      on:input={({ target }) => ($studentName = target.value)}
      hide-label
      placeholder="Input student name"
      clearable />
    <nord-select
      class="mr-4"
      value={$clsName}
      on:change={({ target }) => ($clsName = target.value)}
      hide-label
      placeholder="Select class">
      <option value="class1">class 1</option>
      <option value="class2">class 2</option>
      <option value="class3">class 3</option>
    </nord-select>
  </div>
  <Table
    loading={$loading}
    {columns}
    data={$students.list} />
</div>
