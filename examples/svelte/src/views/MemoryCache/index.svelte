<script>
  import { useRequest } from 'alova/client';
  import { queryStudents } from '../../api/methods';
  import Table from '../../components/Table.svelte';
  import StudentInfoModal from './StudentInfoModal.svelte';

  let showDetail = false;
  let viewingId = 0;
  const { loading, data: students } = useRequest(queryStudents, {
    initialData: {
      list: [],
      total: 0
    },
    immediate: true
  });

  const handleDetailShow = id => {
    viewingId = id;
    showDetail = true;
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name'
    },
    {
      title: 'Class',
      dataIndex: 'cls'
    }
  ];

  const rowProps = row => ({
    style: {
      cursor: 'pointer'
    },
    onClick: () => {
      handleDetailShow(row.id);
    }
  });
</script>

<div>
  <Table
    title="Please click the same item twice."
    loading={$loading}
    {columns}
    data={$students.list}
    {rowProps} />
  <nord-modal
    open={showDetail}
    on:close={() => (showDetail = false)}>
    {#if showDetail}
      <h3 slot="header">
        Now close modal, and reopen this item, it will hit response cache, and wouldn't send request.
      </h3>
      <StudentInfoModal id={viewingId} />
    {/if}
  </nord-modal>
</div>
