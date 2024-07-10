<script>
  import { dehydrateVData, equals, filterSilentMethods, useSQRequest } from 'alova/client';
  import { queryTodo, removeTodo } from '../../api/methods';
  import QueueConsole from '../../components/QueueConsole';
  import Table from '../../components/Table';
  import EditorModal from './EditorModal';

  let networkMode = 0;
  let detailVisible = false;
  let selectedId = null;
  let modalRef;

  const { data: todos, loading } = useSQRequest(queryTodo, {
    behavior: () => (networkMode === 0 ? 'queue' : 'static'),
    initialData: [],
    queue: 'simpleList'
  }).onSuccess(() => {
    filterSilentMethods(undefined, 'simpleList').then(smAry => {
      smAry.forEach(smItem => {
        if (!smItem.reviewData) return;
        const { operate, data } = smItem.reviewData;
        const index = $todos.findIndex(({ id }) => equals(id, data.id));
        if ((operate === 'edit' || operate === 'remove') && index >= 0) {
          operate === 'edit' ? $todos.splice(index, 1, data) : $todos.splice(index, 1);
        } else if (operate === 'add' && index < 0) {
          $todos.unshift(data);
        }
        $todos = $todos;
      });
    });
  });

  const { send: removeSend, loading: removing } = useSQRequest(id => removeTodo(id), {
    behavior: () => (networkMode === 0 ? 'silent' : 'static'),
    queue: 'simpleList',
    retryError: /network error/,
    maxRetryTimes: 5,
    backoff: {
      delay: 2000,
      multiplier: 1.5,
      endQuiver: 0.5
    },
    immediate: false
  }).onSuccess(({ sendArgs: [removeId], silentMethod }) => {
    $todos = $todos.filter(todo => todo.id !== removeId);
    if (silentMethod) {
      silentMethod.reviewData = {
        operate: 'remove',
        data: { id: removeId }
      };
      silentMethod.save();
    }
  });

  const tableColumns = [
    { title: 'ID', dataIndex: 'id', render: 'slot1' },
    { title: 'Content', dataIndex: 'content' },
    { title: 'Time', dataIndex: 'time' },
    {
      title: 'Operate',
      dataIndex: 'operate',
      render: 'slot4'
    }
  ];

  function editItem(id = null) {
    detailVisible = true;
    selectedId = id;
  }

  function closeModal() {
    detailVisible = false;
  }

  function setNetworkMode(value) {
    networkMode = value;
  }
</script>

<div class="responsive">
  <div class="grid gap-y-4">
    <div class="grid grid-cols-2 gap-y-2">
      <nord-button
        variant="primary"
        on:click={() => editItem()}>
        Add Item
      </nord-button>
      {#if $removing}
        <nord-spinner size="s" />
      {/if}
    </div>
    <Table
      columns={tableColumns}
      data={$todos}
      loading={$loading}>
      <span
        slot="slot1"
        let:value>{dehydrateVData(value)}</span>
      <div
        class="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-2"
        slot="slot4"
        let:row>
        <nord-button
          size="s"
          on:click={() => editItem(row.id)}>
          Edit
        </nord-button>
        <nord-button
          variant="danger"
          size="s"
          on:click={() => removeSend(row.id)}>
          Remove
        </nord-button>
      </div>
    </Table>
    <nord-modal
      open={detailVisible || undefined}
      on:close={() => (detailVisible = false)}>
      <h3 slot="header">{selectedId ? 'Edit Todo' : 'Add Todo'}</h3>
      {#if detailVisible}
        <EditorModal
          id={selectedId}
          {networkMode}
          on:close={closeModal} />
      {/if}
    </nord-modal>
  </div>
  <QueueConsole
    on:modeChange={({ detail }) => setNetworkMode(detail)}
    queueName="simpleList" />
</div>
