import { useRequest } from 'alova/client';
import { For } from 'solid-js';
import { editStudent, queryStudentDetail } from '../../api/methods';

function EditorModal(props) {
  const {
    loading,
    data: detail,
    update
  } = useRequest(queryStudentDetail(props.id), {
    initialData: {
      name: 'newName',
      cls: 'class1'
    },
    immediate: !!props.id
  });

  const { loading: submitting, send: sendStudentAdd } = useRequest(
    () => editStudent(detail().name, detail().cls, props.id),
    {
      immediate: false
    }
  );

  const submitStudent = async () => {
    if (!detail().name) {
      alert('Please input student name');
      return;
    }
    const newId = await sendStudentAdd();
    props.onSubmit({
      ...detail(),
      id: newId || detail().id
    });
  };

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

  return (
    <>
      {loading() ? (
        <nord-spinner />
      ) : (
        <div class="grid gap-y-4">
          <nord-input
            label="Name"
            value={detail().name}
            onInput={e => {
              update({
                data: {
                  ...detail(),
                  name: e.target.value
                }
              });
            }}
          />
          <nord-select
            label="Class"
            value={detail().cls}
            onInput={e => {
              update({
                data: {
                  ...detail(),
                  cls: e.target.value
                }
              });
            }}>
            <For each={classOptions}>{option => <option value={option.value}>{option.title}</option>}</For>
          </nord-select>
          <nord-button
            variant="primary"
            onClick={submitStudent}
            loading={submitting() || undefined}>
            Submit
          </nord-button>
        </div>
      )}
    </>
  );
}

export default EditorModal;
