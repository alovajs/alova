import { usePagination, useRequest } from 'alova/client';
import { For, createSignal } from 'solid-js';
import { queryStudents, removeStudent } from '../../api/methods';
import Table from '../../components/Table';
import EditorModal from './EditorModal';

function View() {
  const [studentName, setStudentName] = createSignal('');
  const [clsName, setClsName] = createSignal('');
  const [detailVisible, setDetailVisible] = createSignal(false);
  let selectedId;

  const {
    loading,
    data: students,
    page,
    total,
    pageSize,
    pageCount,
    remove,
    insert,
    refresh,
    reload,
    update
  } = usePagination((page, pageSize) => queryStudents(page, pageSize, studentName(), clsName()), {
    watchingStates: [studentName, clsName],
    initialData: { total: 0, list: [] },
    debounce: [800],
    total: res => res.total,
    data: res => res.list
  });

  const editItem = id => {
    selectedId = id;
    setDetailVisible(true);
  };

  const { send: removeSend, loading: removing } = useRequest(({ id }) => removeStudent(id), {
    immediate: false
  }).onSuccess(({ args: [row] }) => {
    remove(row);
  });

  const updateList = detail => {
    if (selectedId) {
      refresh(page());
    } else {
      insert(detail);
    }
    setDetailVisible(false);
  };

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
            type="error"
            disabled={removing() || undefined}
            onClick={() => removeSend(row)}>
            Remove
          </nord-button>
        </div>
      )
    }
  ];

  const classOptions = [
    { title: 'class 1', value: 'class1' },
    { title: 'class 2', value: 'class2' },
    { title: 'class 3', value: 'class3' }
  ];

  return (
    <div>
      <div class="grid gap-y-4">
        <div class="grid grid-cols-[repeat(5,fit-content(100px))] gap-x-2">
          <nord-input
            hide-label
            value={studentName()}
            onInput={({ target }) => setStudentName(target.value)}
            placeholder="input student name"
          />
          <nord-select
            placeholder="select class"
            value={clsName()}
            hide-label
            onInput={({ target }) => setClsName(target.value)}>
            <For each={classOptions}>{({ title, value }) => <option value={value}>{title}</option>}</For>
          </nord-select>
          <nord-button
            variant="primary"
            onClick={() => editItem(null)}>
            Add Item
          </nord-button>
          <nord-button
            variant="primary"
            onClick={reload}>
            Reload
          </nord-button>
        </div>

        <Table
          loading={loading()}
          columns={columns}
          data={students()}
          pagination={{
            page,
            pageSize,
            onChange: (newPage, newPageSize) => {
              update({
                page: newPage,
                pageSize: newPageSize
              });
            },
            pageCount,
            total,
            pageSizes: [10, 20]
          }}
        />
      </div>

      <nord-modal
        open={detailVisible() || undefined}
        onClose={() => {
          setDetailVisible(false);
        }}>
        <h3 slot="header">Student Info</h3>
        {detailVisible() ? (
          <EditorModal
            id={selectedId}
            onSubmit={updateList}
          />
        ) : null}
      </nord-modal>
    </div>
  );
}

export default View;
