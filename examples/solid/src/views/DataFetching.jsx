import { useFetcher, useRequest } from 'alova/client';
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

  const timers = {};
  const { fetch, loading: fetching } = useFetcher();

  // Prefetch detail data when staying for more than 200 milliseconds
  const handleFetchDetail = id => {
    timers[id] = setTimeout(() => {
      fetch(queryStudentDetail(id));
    }, 200);
  };

  const handleRemoveFetch = id => {
    if (timers[id]) {
      clearTimeout(timers[id]);
      delete timers[id];
    }
  };

  const handleDetailShow = id => {
    setViewingId(id);
    setShowDetail(true);
  };

  return (
    <div class="relative">
      {fetching() && (
        <div class="flex items-center absolute top-4 right-4 z-50">
          <nord-spinner
            size="l"
            class="mr-4"
          />
          <span class="font-bold">Fetching...</span>
        </div>
      )}

      <Table
        title="Mouse move to items below, it will prefetch detail data."
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
          onClick: () => handleDetailShow(row.id),
          onMouseEnter: () => handleFetchDetail(row.id),
          onMouseLeave: () => handleRemoveFetch(row.id)
        })}
      />
      <nord-modal
        open={showDetail() || undefined}
        onClose={() => {
          setShowDetail(false);
        }}>
        {showDetail() && <StudentInfoModal id={viewingId()} />}
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
