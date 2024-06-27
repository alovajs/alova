import { useRequest } from 'alova/client';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { alova } from '../api';
import { editStudent, queryStudentDetail, queryStudents } from '../api/methods';
import Table from '../components/Table';
import { showToast, useEvent } from '../helper';

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

  useEffect(() => {
    const offHandler = alova.l1Cache.emitter.on('success', event => {
      if (event.type === 'remove') {
        showToast(`The cache of key \`${event.key}\` has been removed.`, { duration: 5000 });
      }
    });
    return offHandler;
  });

  return (
    <div>
      <Table
        title="Please select one item and modify it."
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
        {showDetail ? (
          <StudentInfoModal
            id={viewingId}
            onClose={() => setShowDetail(false)}
          />
        ) : null}
      </nord-modal>
    </div>
  );
}
export default View;

const StudentInfoModal = ({ id, onClose }) => {
  const [fromCache, setFromCache] = useState(false);
  const {
    loading,
    data: detail,
    update
  } = useRequest(queryStudentDetail(id), {
    initialData: {}
  }).onSuccess(event => {
    setFromCache(event.fromCache);
  });

  const { loading: submiting, send: submit } = useRequest(() => editStudent(detail.name, detail.cls, id), {
    immediate: false
  });
  const handleSubmit = async () => {
    await submit();
    onClose();
  };

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
            <nord-input
              label="name"
              value={detail.name}
              onInput={({ target }) => {
                update({
                  data: {
                    ...detail,
                    name: target.value
                  }
                });
              }}></nord-input>
            <nord-input
              label="class"
              value={detail.cls}
              onInput={({ target }) => {
                update({
                  data: {
                    ...detail,
                    cls: target.value
                  }
                });
              }}></nord-input>
          </div>
        )}
      </div>

      <nord-button-group
        slot="footer"
        variant="spaced">
        <nord-button
          onClick={onClose}
          expand
          id="cancelButton">
          Cancel
        </nord-button>
        <nord-button
          expand
          id="confirmButton"
          variant="primary"
          loading={submiting || undefined}
          onClick={handleSubmit}>
          Save changes
        </nord-button>
      </nord-button-group>
    </>
  );
};

StudentInfoModal.propTypes = {
  id: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired
};
