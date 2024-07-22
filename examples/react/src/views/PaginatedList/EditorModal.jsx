import { useRequest } from 'alova/client';
import PropTypes from 'prop-types';
import { editStudent, queryStudentDetail } from '../../api/methods';

function EditorModal({ id, onSubmit }) {
  const {
    loading,
    data: detail,
    update
  } = useRequest(queryStudentDetail(id), {
    initialData: {
      name: 'newName',
      cls: 'class1'
    },
    immediate: !!id
  });

  const { loading: submitting, send: sendStudentAdd } = useRequest(() => editStudent(detail.name, detail.cls, id), {
    immediate: false
  });

  const submitStudent = async () => {
    if (!detail.name) {
      alert('Please input student name');
      return;
    }
    const newId = await sendStudentAdd();
    onSubmit({
      ...detail,
      id: newId || detail.id
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

  if (loading) {
    return <nord-spinner />;
  }

  return (
    <div className="grid gap-y-4">
      <nord-input
        label="Name"
        value={detail.name}
        onInput={({ target }) => {
          update({
            data: {
              ...detail,
              name: target.value
            }
          });
        }}
      />
      <nord-select
        label="Class"
        value={detail.cls}
        onInput={({ target }) => {
          update({
            data: {
              ...detail,
              cls: target.value
            }
          });
        }}>
        {classOptions.map(option => (
          <option
            key={option.value}
            value={option.value}>
            {option.title}
          </option>
        ))}
      </nord-select>
      <nord-button
        variant="primary"
        onClick={submitStudent}
        loading={submitting || undefined}>
        Submit
      </nord-button>
    </div>
  );
}
EditorModal.propTypes = {
  id: PropTypes.number,
  onSubmit: PropTypes.func.isRequired
};
export default EditorModal;
