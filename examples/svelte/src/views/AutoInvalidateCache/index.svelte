<script>
  import { useRequest } from 'alova/client';
  import { onMount } from 'svelte';
  import { alova } from '../../api';
  import { queryStudents } from '../../api/methods';
  import Table from '../../components/Table';
  import StudentInfoModal from './StudentInfoModal.svelte';

  let showDetail = false;
  let viewingId = 0;
  let cacheInvalidatingRecords = [];

  const {
    loading,
    data: students,
    send
  } = useRequest(queryStudents, {
    initialData: {
      list: [],
      total: 0
    }
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id'
    },
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
    onClick: () => handleDetailShow(row.id)
  });

  const handleDetailShow = id => {
    viewingId = id;
    showDetail = true;
  };

  onMount(() => {
    const offHandler = alova.l1Cache.emitter.on('success', event => {
      if (event.type === 'remove') {
        cacheInvalidatingRecords = [
          ...cacheInvalidatingRecords,
          `[${cacheInvalidatingRecords.length + 1}]. The cache of key \`${event.key}\` has been removed.`
        ];
      }
    });
    return offHandler;
  });

  const handleModalClose = isSubmit => {
    showDetail = false;
    if (isSubmit) {
      send();
    }
  };
</script>

<div class="responsive">
  <Table
    title="Please select one item and modify it."
    loading={$loading}
    {columns}
    data={$students.list}
    {rowProps} />
  <nord-modal
    open={showDetail || undefined}
    on:close={() => (showDetail = false)}
    title="Student Info">
    <h3 slot="header">Edit Info</h3>
    {#if showDetail}
      <StudentInfoModal
        id={viewingId}
        on:close={handleModalClose} />
    {/if}
  </nord-modal>
  <nord-card>
    <h3
      slot="header"
      class="title">
      Cache invalidating Records
    </h3>
    <div class="flex flex-col leading-6">
      {#each cacheInvalidatingRecords as msg}
        <span>{msg}</span>
      {/each}
    </div>
  </nord-card>
</div>
