<template>
  <div>
    <div class="grid grid-cols-[repeat(5,fit-content(100px))] gap-x-2 mb-8">
      <nord-input
        hide-label
        v-model="studentName"
        placeholder="input student name" />
      <nord-select
        placeholder="select class"
        v-model="clsName"
        hide-label>
        <option
          v-for="option in classOptions"
          :key="option.value"
          :value="option.value">
          {{ option.title }}
        </option>
      </nord-select>
      <nord-button
        variant="primary"
        @click="() => editItem(null)">
        Add Item
      </nord-button>
      <nord-button
        variant="primary"
        @click="reload">
        Reload
      </nord-button>
    </div>

    <Table
      :loading="loading"
      :columns="columns"
      :data="students" />

    <nord-modal
      :open="detailVisible || undefined"
      @close="detailVisible = false">
      <h3 slot="header">Student Info</h3>
      <EditorModal
        v-if="detailVisible"
        :id="selectedItem?.id"
        @submit="updateList" />
    </nord-modal>
  </div>
</template>

<script setup lang="jsx">
import { usePagination, useRequest } from 'alova/client';
import { ref, watch } from 'vue';
import { queryStudents, removeStudent } from '../../api/methods';
import Table from '../../components/Table.vue';
import EditorModal from './EditorModal';
import useScroll from './useScroll';

const studentName = ref('');
const clsName = ref();
const detailVisible = ref(false);
let selectedItem = null;

const {
  loading,
  data: students,
  page,
  remove,
  insert,
  refresh,
  reload,
  isLastPage
} = usePagination((page, pageSize) => queryStudents(page, pageSize, studentName.value, clsName.value), {
  watchingStates: [studentName, clsName],
  initialData: { total: 0, list: [] },
  debounce: [800],
  append: true,
  initialPageSize: 15,
  total: res => res.total,
  data: res => res.list
});

const editItem = row => {
  detailVisible.value = true;
  selectedItem = row;
};

const { send: removeSend, loading: removing } = useRequest(({ id }) => removeStudent(id), {
  immediate: false
}).onSuccess(({ args: [row] }) => {
  remove(row);
});

const updateList = detail => {
  if (selectedItem) {
    refresh(selectedItem);
  } else {
    insert(detail);
  }
  detailVisible.value = false;
};

const columns = [
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
    key: 'cls',
    dataIndex: 'cls'
  },
  {
    title: 'Operate',
    dataIndex: 'operate',
    render: (_, row) => (
      <div class="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-2">
        <nord-button
          size="s"
          onClick={() => editItem(row)}>
          Edit
        </nord-button>
        <nord-button
          variant="danger"
          size="s"
          type="error"
          disabled={removing.value || undefined}
          onClick={() => removeSend(row)}>
          Remove
        </nord-button>
      </div>
    )
  }
];

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

// 滚动到底部加载
const { isBottom } = useScroll();
watch(isBottom, () => {
  if (isBottom.value && !loading.value && !isLastPage.value) {
    page.value = page.value + 1;
  }
});
</script>
