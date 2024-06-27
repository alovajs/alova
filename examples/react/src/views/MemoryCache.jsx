import { useRequest } from 'alova/client';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { queryStudentDetail, queryStudents } from '../api/methods';
import Table from '../components/Table';
import { useEvent } from '../helper';

function View() {
  const [showDetail, setShowDetail] = useState(false);
  const [viewingId, setViewingId] = useState(0);
  const { loading, data: students } = useRequest(() => queryStudents(), {
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
  const { ref: modalRef } = useEvent({
    close() {
      setShowDetail(false);
    }
  });

  return (
    <div>
      <Table
        title="Please click the same item twice."
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
          }
        })}
      />
      <nord-modal
        open={showDetail || undefined}
        ref={modalRef}
        title="Student Info">
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
        Now close modal, and reopen this item, it will hit response cache, and wouldn't send request.
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
