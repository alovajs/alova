<script>
  import { useFetcher, useRequest } from 'alova/client';
  import { queryStudentDetail, queryStudents } from '../../api/methods';
  import Table from '../../components/Table.svelte';
  import EditModal from './EditModal.svelte';

  let showDetail = false;
  let viewingId = 0;
  const { loading, data: students } = useRequest(queryStudents, {
    initialData: {
      list: [],
      total: 0
    },
    immediate: true
  });

  const timers = {};
  const { fetch, loading: fetching } = useFetcher();

  // Prefetch detail data when staying for more than 200 milliseconds
  function handleFetchDetail(id) {
    timers[id] = setTimeout(() => {
      fetch(queryStudentDetail(id));
    }, 200);
  }

  function handleRemoveFetch(id) {
    if (timers[id]) {
      clearTimeout(timers[id]);
      delete timers[id];
    }
  }

  function handleDetailShow(id) {
    viewingId = id;
    showDetail = true;
  }

  function handleModalClose() {
    showDetail = false;
  }

  const tableColumns = [
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
    onClick: () => handleDetailShow(row.id),
    onMouseenter: () => handleFetchDetail(row.id),
    onMouseleave: () => handleRemoveFetch(row.id)
  });
</script>

<div class="relative">
  {#if $fetching}
    <div class="flex items-center absolute top-4 right-4 z-50">
      <nord-spinner
        size="l"
        class="mr-4"></nord-spinner>
      <span class="font-bold">Fetching...</span>
    </div>
  {/if}

  <Table
    title="Mouse move to items below, it will prefetch detail data."
    loading={$loading}
    columns={tableColumns}
    data={$students.list}
    {rowProps}>
  </Table>

  <nord-modal
    open={showDetail}
    on:close={handleModalClose}>
    <h3 slot="header">Now close modal, and reopen this item, it will hit response cache, and wouldn't send request.</h3>
    {#if showDetail}
      <EditModal id={viewingId} />
    {/if}
  </nord-modal>
</div>
