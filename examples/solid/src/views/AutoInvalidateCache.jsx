import { useRequest } from 'alova/client';
import { For, createSignal } from 'solid-js';
import { alova } from '../api';
import { editStudent, queryStudentDetail, queryStudents } from '../api/methods';
import Table from '../components/Table';

function View() {
  const [showDetail, setShowDetail] = createSignal(false);
  const [viewingId, setViewingId] = createSignal(0);
  const [cacheInvalidatingRecords, setCacheInvalidatingRecords] = createSignal([]);

  const {
    loading,
    data: students,
    send
  } = useRequest(() => queryStudents(), {
    initialData: { list: [], total: 0 }
  });

  const handleDetailShow = id => {
    setViewingId(id);
    setShowDetail(true);
  };

  alova.l1Cache.emitter.on('success', event => {
    if (event.type === 'remove') {
      setCacheInvalidatingRecords(prev => [
        ...prev,
        `[${prev.length + 1}]. The cache of key \`${event.key}\` has been removed.`
      ]);
    }
  });

  const handleModalClose = isSubmit => {
    setShowDetail(false);
    if (isSubmit) send();
  };

  return (
    <div class="responsive">
      <Table
        title="Please select one item and modify it."
        loading={loading()}
        columns={[
          { title: 'ID', dataIndex: 'id' },
          { title: 'Name', dataIndex: 'name' },
          { title: 'Class', dataIndex: 'cls' }
        ]}
        data={students().list}
        rowProps={row => ({
          style: { cursor: 'pointer' },
          onClick: () => handleDetailShow(row.id)
        })}
      />
      <nord-modal
        open={showDetail()}
        onClose={() => {
          setShowDetail(false);
        }}
        title="Student Info">
        {showDetail() && (
          <StudentInfoModal
            id={viewingId()}
            onClose={handleModalClose}
          />
        )}
      </nord-modal>

      <nord-card>
        <h3
          slot="header"
          class="title">
          Cache invalidating Records
        </h3>
        <div class="flex flex-col leading-6">
          <For each={cacheInvalidatingRecords()}>{msg => <span>{msg}</span>}</For>
        </div>
      </nord-card>
    </div>
  );
}

export default View;

function StudentInfoModal(props) {
  const [fromCache, setFromCache] = createSignal(false);

  const {
    loading,
    data: detail,
    update
  } = useRequest(queryStudentDetail(props.id), {
    initialData: {}
  }).onSuccess(event => {
    setFromCache(event.fromCache);
  });

  const { loading: submitting, send: submit } = useRequest(() => editStudent(detail().name, detail().cls, props.id), {
    immediate: false
  });

  const handleSubmit = async () => {
    await submit();
    props.onClose(true);
  };

  return (
    <>
      <h3 slot="header">Edit Info</h3>
      <div>
        {loading() ? (
          <nord-spinner />
        ) : (
          <div class="grid gap-4 text-base">
            <nord-banner>From cache: {fromCache() ? 'Yes' : 'No'}</nord-banner>
            <nord-input
              label="name"
              value={detail().name}
              onInput={({ target }) => update({ data: { ...detail(), name: target.value } })}
            />
            <nord-input
              label="class"
              value={detail().cls}
              onInput={({ target }) => update({ data: { ...detail(), cls: target.value } })}
            />
          </div>
        )}
      </div>

      <nord-button-group
        slot="footer"
        variant="spaced">
        <nord-button
          onClick={() => props.onClose(false)}
          expand
          id="cancelButton">
          Cancel
        </nord-button>
        <nord-button
          expand
          id="confirmButton"
          variant="primary"
          loading={submitting() || undefined}
          onClick={handleSubmit}>
          Save changes
        </nord-button>
      </nord-button-group>
    </>
  );
}
