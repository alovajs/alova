import { usePagination, useRequest } from 'alova/client';
import { useEffect, useRef, useState } from 'react';
import { queryStudents, removeStudent } from '../../api/methods';
import Table from '../../components/Table';
import { useEvent } from '../../helper';
import EditorModal from './EditorModal';
import useScroll from './useScroll';

function View() {
  const [studentName, setStudentName] = useState('');
  const [clsName, setClsName] = useState();
  const [detailVisible, setDetailVisible] = useState(false);
  const selectedItem = useRef();

  const {
    loading,
    data: students,
    page,
    remove,
    insert,
    refresh,
    reload,
    isLastPage,
    update
  } = usePagination((page, pageSize) => queryStudents(page, pageSize, studentName, clsName), {
    watchingStates: [studentName, clsName],
    initialData: { total: 0, list: [] },
    debounce: [800],
    append: true,
    initialPageSize: 15,
    total: res => res.total,
    data: res => res.list
  });

  const editItem = row => {
    setDetailVisible(true);
    selectedItem.current = row;
  };

  const { send: removeSend, loading: removing } = useRequest(({ id }) => removeStudent(id), {
    immediate: false
  }).onSuccess(({ args: [row] }) => {
    remove(row);
  });

  const updateList = detail => {
    if (selectedItem.current) {
      refresh(selectedItem.current);
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
        <div className="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-2">
          <nord-button
            size="s"
            onClick={() => editItem(row)}>
            Edit
          </nord-button>
          <nord-button
            variant="danger"
            size="s"
            type="error"
            disabled={removing || undefined}
            onClick={() => removeSend(row)}>
            Remove
          </nord-button>
        </div>
      )
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
  const { ref: modalRef } = useEvent({
    close() {
      setDetailVisible(false);
    }
  });

  // 滚动到底部加载
  const { isBottom } = useScroll();
  useEffect(() => {
    if (isBottom && !loading && !isLastPage) {
      update({
        page: page + 1
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBottom]);

  return (
    <div>
      <div>
        <div className="grid grid-cols-[repeat(5,fit-content(100px))] gap-x-2 mb-8">
          <nord-input
            hide-label
            value={studentName}
            onInput={({ target }) => setStudentName(target.value)}
            placeholder="input student name"
          />
          <nord-select
            placeholder="select class"
            value={clsName}
            hide-label
            onInput={({ target }) => setClsName(target.value)}>
            {classOptions.map(({ title, value }) => (
              <option
                value={value}
                key={value}>
                {title}
              </option>
            ))}
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
          loading={loading}
          columns={columns}
          data={students}
        />
      </div>

      <nord-modal
        open={detailVisible || undefined}
        ref={modalRef}>
        <h3 slot="header">Student Info</h3>
        {detailVisible ? (
          <EditorModal
            id={selectedItem.current?.id}
            onSubmit={updateList}
          />
        ) : null}
      </nord-modal>
    </div>
  );
}

export default View;
