import { equals, filterSilentMethods, useSQRequest } from 'alova/client';
import { createSignal } from 'solid-js';
import { queryTodo, removeTodo } from '../../api/methods';
import QueueConsole from '../../components/QueueConsole';
import Table from '../../components/Table';
import EditorModal from './EditorModal';

function View() {
  // The `bootSilentFactory` has been called in `main.js`
  const [networkMode, setNetworkMode] = createSignal(0);
  const [detailVisible, setDetailVisible] = createSignal(false);
  const [selectedId, setSelectedId] = createSignal();

  const {
    data: todos,
    loading,
    update
  } = useSQRequest(queryTodo, {
    behavior: () => (networkMode() === 0 ? 'queue' : 'static'),
    initialData: [],
    queue: 'simpleList'
  }).onSuccess(() => {
    // Fill the list data when request success
    filterSilentMethods(undefined, 'simpleList').then(smAry => {
      smAry.forEach(smItem => {
        if (!smItem.reviewData) return;
        const { operate, data } = smItem.reviewData;
        const index = todos().findIndex(({ id }) => equals(id, data.id));
        if ((operate === 'edit' || operate === 'remove') && index >= 0) {
          operate === 'edit' ? todos().splice(index, 1, data) : todos().splice(index, 1);
        } else if (operate === 'add' && index < 0) {
          // Filter any uncommitted items when request hits the cache
          todos().unshift(data);
        }
      });
    });
  });

  const tableColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      render: text => <span>{text}</span>
    },
    {
      title: 'Content',
      dataIndex: 'content'
    },
    {
      title: 'Time',
      dataIndex: 'time'
    },
    {
      title: 'Operate',
      dataIndex: 'operate',
      render: (_, row) => (
        <div class="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-2">
          <nord-button
            size="s"
            onClick={() => editItem(row.id)}>
            Edit
          </nord-button>
          <nord-button
            variant="danger"
            size="s"
            onClick={() => removeSend(row.id)}>
            Remove
          </nord-button>
        </div>
      )
    }
  ];

  const editItem = id => {
    setDetailVisible(true);
    setSelectedId(id);
  };

  const { send: removeSend, loading: removing } = useSQRequest(id => removeTodo(id), {
    behavior: () => (networkMode() === 0 ? 'silent' : 'static'),
    queue: 'simpleList',
    retryError: /network error/,
    maxRetryTimes: 5,
    backoff: {
      delay: 2000,
      multiplier: 1.5,
      endQuiver: 0.5
    },
    immediate: false
  }).onSuccess(({ args: [removeId], silentMethod }) => {
    update({
      data: todos().filter(todo => todo.id !== removeId)
    });
    if (silentMethod) {
      silentMethod.reviewData = {
        operate: 'remove',
        data: { id: removeId }
      };
      silentMethod.save();
    }
  });

  return (
    <div class="responsive">
      <div class="grid gap-y-4">
        <div class="grid grid-cols-2 gap-y-2">
          <nord-button
            variant="primary"
            onClick={() => editItem()}>
            Add Item
          </nord-button>
          {removing() && <nord-spinner size="s" />}
        </div>
        <Table
          columns={tableColumns}
          data={todos()}
          loading={loading()}
        />
        <nord-modal
          open={detailVisible() || undefined}
          onClose={() => {
            setDetailVisible(false);
          }}>
          <h3 slot="header">{selectedId() ? 'Edit Todo' : 'Add Todo'}</h3>
          {detailVisible() ? (
            <EditorModal
              id={selectedId()}
              networkMode={networkMode}
              onClose={() => setDetailVisible(false)}
            />
          ) : null}
        </nord-modal>
      </div>
      <QueueConsole
        onModeChange={setNetworkMode}
        queueName="simpleList"
      />
    </div>
  );
}

export default View;
