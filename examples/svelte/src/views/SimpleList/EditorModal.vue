<template>
  <div>
    <nord-spinner v-if="loading"></nord-spinner>
    <div class="grid gap-y-4">
      <nord-textarea
        label="Content"
        v-model="detail.content"></nord-textarea>
      <nord-input
        type="time"
        label="Time"
        v-model="detail.time" />
      <nord-button
        variant="primary"
        :loading="submitting"
        @click="submitTodo">
        Submit
      </nord-button>
    </div>
  </div>
</template>

<script setup>
import { equals, filterSilentMethods, updateStateEffect, useSQRequest } from 'alova/client';
import { editTodo, queryTodo, todoDetail } from '../../api/methods';
import { showToast } from '../../helper';

const props = defineProps({
  id: Number,
  networkMode: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['close']);
const nowDate = new Date();
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

const { loading: submitting, send: sendTodoEdit } = useSQRequest(
  () => editTodo(detail.value.content, detail.value.time, props.id),
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
  const editingItem = { ...detail.value, id: props.id || data.id };
  if (silentMethod) {
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
  if (!detail.value.content || !detail.value.time) {
    showToast('Content and time cannot be empty');
    return;
  }
  await sendTodoEdit();
  emit('close');
};
</script>
