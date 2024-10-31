import { useRequest } from 'alova/client';
import { createSignal } from 'solid-js';
import { queryStudentDetail, queryStudents } from '../api/methods';
import Table from '../components/Table';

function View() {
  const [showDetail, setShowDetail] = createSignal(false);
  const [viewingId, setViewingId] = createSignal(0);
  const { loading, data: students } = useRequest(queryStudents, {
    initialData: {
      list: [],
      total: 0
    },
    immediate: true
  });

  const handleDetailShow = id => {
    setViewingId(id);
    setShowDetail(true);
  };

  return (
    <div>
      <Table
        title="Please click the same item twice."
        loading={loading()}
        columns={[
          {
            title: 'Name',
            dataIndex: 'name'
          },
          {
            title: 'Class',
            dataIndex: 'cls'
          }
        ]}
        data={students().list}
        rowProps={row => ({
          style: {
            cursor: 'pointer'
          },
          onClick: () => {
            handleDetailShow(row.id);
          }
        })}
      />
      <nord-modal
        open={showDetail() || undefined}
        onClose={() => {
          setShowDetail(false);
        }}>
        {showDetail() ? <StudentInfoModal id={viewingId()} /> : null}
      </nord-modal>
    </div>
  );
}
export default View;

const StudentInfoModal = props => {
  const [fromCache, setFromCache] = createSignal(false);
  const { loading, data: detail } = useRequest(queryStudentDetail(props.id), {
    initialData: {}
  }).onSuccess(event => {
    setFromCache(event.fromCache);
  });

  return (
    <>
      <h3 slot="header">
        Now close modal, and reopen this item, it will hit response cache, and wouldn&apos;t send request.
      </h3>
      <div>
        {loading() ? (
          <nord-spinner />
        ) : (
          <div class="grid gap-4 text-base">
            <nord-banner>From cache: {fromCache() ? 'Yes' : 'No'}</nord-banner>
            <span>Name: {detail().name}</span>
            <span>Class: {detail().cls}</span>
          </div>
        )}
      </div>
    </>
  );
};
