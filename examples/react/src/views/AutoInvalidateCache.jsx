import { useRequest } from 'alova/client';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { alova } from '../api';
import { editStudent, queryStudentDetail, queryStudents } from '../api/methods';
import Table from '../components/Table';
import { useEvent } from '../helper';

function View() {
  const [showDetail, setShowDetail] = useState(false);
  const [viewingId, setViewingId] = useState(0);
  const [cacheInvalidatingRecords, setCacheInvalidatingRecords] = useState([]);
  const {
    loading,
    data: students,
    send
  } = useRequest(() => queryStudents(), {
    initialData: {
      list: [],
      total: 0
    }
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
        setCacheInvalidatingRecords(prev => [
          ...prev,
          `[${prev.length + 1}]. The cache of key \`${event.key}\` has been removed.`
        ]);
      }
    });
    return offHandler;
  });

  const handleModalClose = isSubmit => {
    setShowDetail(false);
    if (isSubmit) {
      send();
    }
  };

  return (
    <div className="responsive">
      <Table
        title="Please select one item and modify it."
        loading={loading}
        columns={[
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
            onClose={handleModalClose}
          />
        ) : null}
      </nord-modal>

      <nord-card>
        <h3
          slot="header"
          className="title">
          Cache invalidating Records
        </h3>
        <div className="flex flex-col leading-6">
          {cacheInvalidatingRecords.map(msg => (
            <span key={msg}>{msg}</span>
          ))}
        </div>
      </nord-card>
    </div>
  );
}
export default View;

function StudentInfoModal({ id, onClose }) {
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
    onClose(true);
  };

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
}

StudentInfoModal.propTypes = {
  id: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired
};
