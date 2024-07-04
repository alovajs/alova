import { equals, filterSilentMethods, updateStateEffect, useSQRequest } from 'alova/client';
import PropTypes from 'prop-types';
import { editTodo, queryTodo, todoDetail } from '../../api/methods';
import { showToast } from '../../helper';

const nowDate = new Date();
function EditorModal({ id, networkMode, onClose }) {
  const {
    loading,
    data: detail,
    update
  } = useSQRequest(() => todoDetail(id), {
    behavior: 'static',
    queue: 'simpleList',
    initialData: { content: 'new todo', time: nowDate.getHours() + ':' + nowDate.getMinutes() },
    immediate: !!id,
    vDataCaptured: () => {
      const targetSM = filterSilentMethods('edit' + id).pop();
      if (targetSM?.reviewData) {
        return { ...targetSM.reviewData.data };
      }
    }
  });

  // submit with silent request
  const { loading: submitting, send: sendTodoEdit } = useSQRequest(() => editTodo(detail.content, detail.time, id), {
    behavior: () => (networkMode === 0 ? 'silent' : 'static'),
    queue: 'simpleList',
    retryError: /network error/,
    maxRetryTimes: 5,
    backoff: {
      delay: 2000,
      multiplier: 1.5,
      endQuiver: 0.5
    },
    immediate: false,
    silentDefaultResponse: () => ({ id: '--' })
  }).onSuccess(async ({ data, silentMethod }) => {
    const editingItem = { ...detail, id: id || data.id };
    if (silentMethod) {
      // set method name, so it can be queried in next time
      silentMethod.entity.setName('edit' + editingItem.id);
      silentMethod.reviewData = {
        operate: id ? 'edit' : 'add',
        data: editingItem
      };
      await silentMethod.save();
    }

    updateStateEffect(queryTodo(), todoList => {
      if (id) {
        const index = todoList.findIndex(item => equals(item.id, id));
        if (index >= 0) {
          todoList.splice(index, 1, editingItem);
        }
      } else {
        todoList.unshift(editingItem);
      }
      return todoList;
    });
  });

  const submitTodo = async () => {
    if (!detail.content || !detail.time) {
      showToast('Content and time cannot be empty');
      return;
    }
    await sendTodoEdit();
    onClose();
  };

  return (
    <div>
      {loading ? <nord-spinner /> : null}
      <div className="grid gap-y-4">
        <nord-textarea
          label="Content"
          value={detail.content}
          onInput={({ target }) => {
            update({
              data: {
                ...detail,
                content: target.value
              }
            });
          }}></nord-textarea>
        <nord-input
          type="time"
          label="Time"
          value={detail.time}
          onInput={({ target }) => {
            update({
              data: {
                ...detail,
                time: target.value
              }
            });
          }}
        />
        <nord-button
          variant="primary"
          loading={submitting || undefined}
          onClick={submitTodo}>
          Submit
        </nord-button>
      </div>
    </div>
  );
}
EditorModal.propTypes = {
  id: PropTypes.number,
  networkMode: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired
};
export default EditorModal;
