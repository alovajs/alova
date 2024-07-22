<script>
  import { equals, filterSilentMethods, updateStateEffect, useSQRequest } from 'alova/client';
  import { createEventDispatcher } from 'svelte';
  import { editTodo, queryTodo, todoDetail } from '../../api/methods';
  import { showToast } from '../../helper';

  export let id;
  export let networkMode;

  const nowDate = new Date();
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

  const { loading: submitting, send: sendTodoEdit } = useSQRequest(() => editTodo($detail.content, $detail.time, id), {
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
    const editingItem = { ...$detail, id: id || data.id };
    if (silentMethod) {
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

  async function submitTodo() {
    if (!$detail.content || !$detail.time) {
      showToast('Content and time cannot be empty');
      return;
    }
    await sendTodoEdit();
    dispatch('close');
  }
  const dispatch = createEventDispatcher();
</script>

<div>
  {#if $loading}
    <nord-spinner></nord-spinner>
  {/if}
  <div class="grid gap-y-4">
    <nord-textarea
      label="Content"
      value={$detail.content}
      on:input={({ target }) => ($detail.content = target.value)}></nord-textarea>
    <nord-input
      type="time"
      label="Time"
      value={$detail.time}
      on:input={({ target }) => ($detail.time = target.value)} />
    <nord-button
      variant="primary"
      loading={$submitting}
      on:click={submitTodo}>
      Submit
    </nord-button>
  </div>
</div>
