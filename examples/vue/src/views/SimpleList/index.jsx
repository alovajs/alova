import { equals, filterSilentMethods, useSQRequest } from 'alova/client';
import { useState } from 'react';
import { queryTodo, removeTodo } from '../../api/methods';
import QueueConsole from '../../components/QueueConsole';
import Table from '../../components/Table.vue';
import { useEvent } from '../../helper';
import EditorModal from './EditorModal';

function View() {
  // The `bootSilentFactory` has been called in `main.js`
  const [networkMode, setNetworkMode] = useState(0);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedId, setSelectedId] = useState();

  const {
    data: todos,
    loading,
    update
  } = useSQRequest(queryTodo, {
    behavior: () => (networkMode === 0 ? 'queue' : 'static'),
    initialData: [],
    queue: 'simpleList'
  }).onSuccess(() => {
    // fill the list data when request success
    filterSilentMethods(undefined, 'simpleList').then(smAry => {
      smAry.forEach(smItem => {
        if (!smItem.reviewData) {
          return;
        }
        const { operate, data } = smItem.reviewData;
        const index = todos.findIndex(({ id }) => equals(id, data.id));
        if ((operate === 'edit' || operate === 'remove') && index >= 0) {
          operate === 'edit' ? todos.splice(index, 1, data) : todos.splice(index, 1);
        } else if (operate === 'add' && index < 0) {
          // 在重新请求并命中缓存时将会有已添加的未提交项，这些需要过滤
          todos.unshift(data);
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
        <div className="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-2">
          <nord-button
            variant="primary"
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
    update({
      data: todos.filter(todo => todo.id !== removeId)
    });
    if (silentMethod) {
      silentMethod.reviewData = {
        operate: 'remove',
        data: { id: removeId }
      };
      silentMethod.save();
    }
  });

  // useEffect(() => {
  //   onError(event => {
  //     refConsole.current.setFail(event.error);
  //   });
  // }, [onError]);

  const { ref: modalRef } = useEvent({
    close() {
      setDetailVisible(false);
    }
  });

  return (
    <div className="responsive">
      <div className="grid gap-y-4">
        <div className="grid grid-cols-2 gap-y-2">
          <nord-button
            variant="primary"
            onClick={() => editItem()}>
            Add Item
          </nord-button>
          {removing && <nord-spinner size="s" />}
        </div>
        <Table
          columns={tableColumns}
          data={todos}
          loading={loading}
        />
        <nord-modal
          open={detailVisible || undefined}
          ref={modalRef}>
          <h3 slot="header">{selectedId ? 'Edit Todo' : 'Add Todo'}</h3>
          {detailVisible ? (
            <EditorModal
              id={selectedId}
              networkMode={networkMode}
              onClose={() => setDetailVisible(false)}
            />
          ) : null}
        </nord-modal>
      </div>
      <QueueConsole
        onModeChange={value => setNetworkMode(value)}
        queueName="simpleList"
      />
    </div>
  );
}

export default View;
