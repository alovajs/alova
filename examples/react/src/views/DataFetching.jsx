import { useFetcher, useRequest } from 'alova/client';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { queryStudentDetail, queryStudents } from '../api/methods';
import Table from '../components/Table';
import { useEvent } from '../helper';

function View() {
  const [showDetail, setShowDetail] = useState(false);
  const [viewingId, setViewingId] = useState(0);
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
  const { ref: modalRef } = useEvent({
    close() {
      setShowDetail(false);
    }
  });

  return (
    <div className="relative">
      {fetching ? (
        <div className="flex items-center absolute top-4 right-4 z-50">
          <nord-spinner
            size="l"
            class="mr-4"></nord-spinner>
          <span className="font-bold">Fetching...</span>
        </div>
      ) : null}

      <Table
        title="Mouse move to items below, it will prefetch detail data."
        loading={loading}
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
        data={students.list}
        rowProps={row => ({
          style: {
            cursor: 'pointer'
          },
          onClick: () => {
            handleDetailShow(row.id);
          },
          onMouseEnter: () => handleFetchDetail(row.id),
          onMouseLeave: () => handleRemoveFetch(row.id)
        })}
      />
      <nord-modal
        open={showDetail || undefined}
        ref={modalRef}>
        {showDetail ? <StudentInfoModal id={viewingId} /> : null}
      </nord-modal>
    </div>
  );
}
export default View;

const StudentInfoModal = ({ id }) => {
  const [fromCache, setFromCache] = useState(false);
  const { loading, data: detail } = useRequest(queryStudentDetail(id), {
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
        {loading ? (
          <nord-spinner />
        ) : (
          <div className="grid gap-4 text-base">
            <nord-banner>From cache: {fromCache ? 'Yes' : 'No'}</nord-banner>
            <span>Name: {detail.name}</span>
            <span>Class: {detail.cls}</span>
          </div>
        )}
      </div>
    </>
  );
};

StudentInfoModal.propTypes = {
  id: PropTypes.number.isRequired
};
