<template>
  <div class="responsive">
    <div class="grid gap-y-4">
      <div class="grid grid-cols-2 gap-y-2">
        <nord-button
          variant="primary"
          @click="editItem()"
          >Add Item</nord-button
        >
        <nord-spinner
          v-if="removing"
          size="s" />
      </div>
      <Table
        :columns="tableColumns"
        :data="todos"
        :loading="loading" />
      <nord-modal
        :open="detailVisible || undefined"
        @close="detailVisible = false">
        <h3 slot="header">{{ selectedId ? 'Edit Todo' : 'Add Todo' }}</h3>
        <editor-modal
          v-if="detailVisible"
          :id="selectedId"
          :networkMode="networkMode"
          @close="closeModal" />
      </nord-modal>
    </div>
    <QueueConsole
      @modeChange="setNetworkMode"
      queueName="simpleList" />
  </div>
</template>

<script setup lang="jsx">
import { dehydrateVData, equals, filterSilentMethods, useSQRequest } from 'alova/client';
import { ref } from 'vue';
import { queryTodo, removeTodo } from '../../api/methods';
import QueueConsole from '../../components/QueueConsole';
import Table from '../../components/Table';
import EditorModal from './EditorModal';

const networkMode = ref(0);
const detailVisible = ref(false);
const selectedId = ref(null);
const modalRef = ref(null);

const { data: todos, loading } = useSQRequest(queryTodo, {
  behavior: () => (networkMode.value === 0 ? 'queue' : 'static'),
  initialData: [],
  queue: 'simpleList'
}).onSuccess(() => {
  filterSilentMethods(undefined, 'simpleList').then(smAry => {
    smAry.forEach(smItem => {
      if (!smItem.reviewData) return;
      const { operate, data } = smItem.reviewData;
      const index = todos.value.findIndex(({ id }) => equals(id, data.id));
      if ((operate === 'edit' || operate === 'remove') && index >= 0) {
        operate === 'edit' ? todos.value.splice(index, 1, data) : todos.value.splice(index, 1);
      } else if (operate === 'add' && index < 0) {
        todos.value.unshift(data);
      }
    });
  });
});

const { send: removeSend, loading: removing } = useSQRequest(id => removeTodo(id), {
  behavior: () => (networkMode.value === 0 ? 'silent' : 'static'),
  queue: 'simpleList',
  retryError: /network error/,
  maxRetryTimes: 5,
  backoff: {
    delay: 2000,
    multiplier: 1.5,
    endQuiver: 0.5
  },
  immediate: false
}).onSuccess(({ args: [removeId], silentMethod }) => {
  todos.value = todos.value.filter(todo => todo.id !== removeId);
  if (silentMethod) {
    silentMethod.reviewData = {
      operate: 'remove',
      data: { id: removeId }
    };
    silentMethod.save();
  }
});

const tableColumns = [
  { title: 'ID', dataIndex: 'id', render: text => <span>{dehydrateVData(text)}</span> },
  { title: 'Content', dataIndex: 'content' },
  { title: 'Time', dataIndex: 'time' },
  {
    title: 'Operate',
    dataIndex: 'operate',
    render: (_, row) => (
      <div class="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-2">
        <nord-button
          size="s"
          onClick={() => editItem(row.id)}>
          Edit
        </nord-button>
        <nord-button
          variant="danger"
          size="s"
          onClick={() => removeSend(row.id)}>
          Remove
        </nord-button>
      </div>
    )
  }
];

const editItem = (id = null) => {
  detailVisible.value = true;
  selectedId.value = id;
};

const closeModal = () => {
  detailVisible.value = false;
};

const setNetworkMode = value => {
  networkMode.value = value;
};
</script>
