import { equals, filterSilentMethods, updateStateEffect, useSQRequest } from 'alova/client';
import { editTodo, queryTodo, todoDetail } from '../../api/methods';
import { showToast } from '../../helper';

const nowDate = new Date();
function EditorModal(props) {
  const {
    loading,
    data: detail,
    update
  } = useSQRequest(() => todoDetail(props.id), {
    behavior: 'static',
    queue: 'simpleList',
    initialData: { content: 'new todo', time: nowDate.getHours() + ':' + nowDate.getMinutes() },
    immediate: !!props.id,
    vDataCaptured: () => {
      const targetSM = filterSilentMethods('edit' + props.id).pop();
      if (targetSM?.reviewData) {
        return { ...targetSM.reviewData.data };
      }
    }
  });

  // Submit with silent request
  const { loading: submitting, send: sendTodoEdit } = useSQRequest(
    () => editTodo(detail().content, detail().time, props.id),
    {
      behavior: () => (props.networkMode === 0 ? 'silent' : 'static'),
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
    }
  ).onSuccess(async ({ data, silentMethod }) => {
    const editingItem = { ...detail(), id: props.id || data.id };
    if (silentMethod) {
      // Set method name, so it can be queried next time
      silentMethod.entity.setName('edit' + editingItem.id);
      silentMethod.reviewData = {
        operate: props.id ? 'edit' : 'add',
        data: editingItem
      };
      await silentMethod.save();
    }

    updateStateEffect(queryTodo(), todoList => {
      if (props.id) {
        const index = todoList.findIndex(item => equals(item.id, props.id));
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
    if (!detail().content || !detail().time) {
      showToast('Content and time cannot be empty');
      return;
    }
    await sendTodoEdit();
    props.onClose();
  };

  return (
    <div>
      {loading() ? <nord-spinner /> : null}
      <div class="grid gap-y-4">
        <nord-textarea
          label="Content"
          value={detail().content}
          onInput={({ target }) => {
            update({
              data: {
                ...detail(),
                content: target.value
              }
            });
          }}
        />
        <nord-input
          type="time"
          label="Time"
          value={detail().time}
          onInput={({ target }) => {
            update({
              data: {
                ...detail(),
                time: target.value
              }
            });
          }}
        />
        <nord-button
          variant="primary"
          loading={submitting() || undefined}
          onClick={submitTodo}>
          Submit
        </nord-button>
      </div>
    </div>
  );
}

export default EditorModal;
