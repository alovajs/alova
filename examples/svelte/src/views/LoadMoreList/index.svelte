<script>
  import { usePagination } from 'alova/client';
  import { writable } from 'svelte/store';
  import { queryStudents, removeStudent } from '../../api/methods';
  import Table from '../../components/Table.svelte';
  import EditorModal from './EditorModal.svelte';
  import useScroll from './useScroll';

  const studentName = writable('');
  const clsName = writable('');
  let detailVisible = false;
  let selectedItem = null;

  const {
    loading,
    data: students,
    page,
    remove,
    insert,
    refresh,
    reload,
    isLastPage,
    update,
    removing
  } = usePagination((page, pageSize) => queryStudents(page, pageSize, $studentName, $clsName), {
    watchingStates: [studentName, clsName],
    initialData: { total: 0, list: [] },
    debounce: [800],
    append: true,
    initialPageSize: 15,
    total: res => res.total,
    data: res => res.list,
    actions: {
      remove: ({ id }) => removeStudent(id)
    }
  });

  function editItem(row) {
    detailVisible = true;
    selectedItem = row;
  }

  function updateList({ detail }) {
    if (selectedItem) {
      refresh(selectedItem);
    } else {
      insert(detail);
    }
    detailVisible = false;
  }

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
      key: 'cls',
      dataIndex: 'cls'
    },
    {
      title: 'Operate',
      dataIndex: 'operate',
      render: 'slot4'
    }
  ];

  const classOptions = [
    {
      title: 'class 1',
      value: 'class1'
    },
    {
      title: 'class 2',
      value: 'class2'
    },
    {
      title: 'class 3',
      value: 'class3'
    }
  ];

  // 滚动到底部加载
  const { isBottom } = useScroll();
  $: if ($isBottom && !$loading && !$isLastPage) {
    $page = $page + 1;
  }
</script>

<div>
  <div class="grid grid-cols-[repeat(5,fit-content(100px))] gap-x-2 mb-8">
    <nord-input
      value={$studentName}
      on:input={({ target }) => ($studentName = target.value)}
      hide-label
      placeholder="input student name" />
    <nord-select
      value={$clsName}
      on:change={({ target }) => ($clsName = target.value)}
      hide-label
      placeholder="select class">
      {#each classOptions as option (option.value)}
        <option value={option.value}>{option.title}</option>
      {/each}
    </nord-select>
    <nord-button
      variant="primary"
      on:click={() => editItem(null)}>
      Add Item
    </nord-button>
    <nord-button
      variant="primary"
      on:click={reload}>
      Reload
    </nord-button>
  </div>

  <Table
    loading={$loading}
    {columns}
    data={$students}>
    <div
      slot="slot4"
      let:row
      let:index
      class="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-2">
      <nord-button
        size="s"
        on:click={() => editItem(row)}>
        Edit
      </nord-button>
      <nord-button
        variant="danger"
        size="s"
        type="error"
        disabled={$removing.includes(index) || undefined}
        on:click={() => remove(row)}>
        Remove
      </nord-button>
    </div>
  </Table>

  <nord-modal
    open={detailVisible || undefined}
    on:close={() => (detailVisible = false)}>
    <h3 slot="header">Student Info</h3>
    {#if detailVisible}
      <EditorModal
        id={selectedItem?.id}
        on:submit={updateList} />
    {/if}
  </nord-modal>
</div>
