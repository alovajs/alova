<template>
  <div>
    <div class="grid gap-y-4">
      <div class="grid grid-cols-[repeat(5,fit-content(100px))] gap-x-2">
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
            :value="option.value"
            :key="option.value">
            {{ option.title }}
          </option>
        </nord-select>
        <nord-button
          variant="primary"
          @click="editItem(null)"
          >Add Item</nord-button
        >
        <nord-button
          variant="primary"
          @click="reload"
          >Reload</nord-button
        >
      </div>

      <Table
        :loading="loading"
        :columns="columns"
        :data="students"
        :pagination="{
          page,
          pageSize,
          onChange: onPageChange,
          pageCount,
          total,
          pageSizes: [10, 20]
        }" />
    </div>

    <nord-modal
      :open="detailVisible || undefined"
      @close="detailVisible = false">
      <h3 slot="header">Student Info</h3>
      <editor-modal
        v-if="detailVisible"
        :id="selectedId"
        @submit="updateList" />
    </nord-modal>
  </div>
</template>

<script setup lang="jsx">
import { usePagination } from 'alova/client';
import { ref } from 'vue';
import { queryStudents, removeStudent } from '../../api/methods';
import Table from '../../components/Table';
import EditorModal from './EditorModal.vue';

const studentName = ref('');
const clsName = ref();
const detailVisible = ref(false);
const selectedId = ref();

const {
  loading,
  data: students,
  page,
  total,
  pageSize,
  pageCount,
  remove,
  insert,
  refresh,
  reload,
  removing
} = usePagination((page, pageSize) => queryStudents(page, pageSize, studentName.value, clsName.value), {
  watchingStates: [studentName, clsName],
  initialData: { total: 0, list: [] },
  debounce: [800],
  total: res => res.total,
  data: res => res.list,
  actions: {
    remove: ({ id }) => removeStudent(id)
  }
});

const editItem = id => {
  detailVisible.value = true;
  selectedId.value = id;
};

const updateList = detail => {
  if (selectedId.value) {
    refresh(page.value);
  } else {
    insert(detail);
  }
  detailVisible.value = false;
};

const onPageChange = (newPage, newPageSize) => {
  page.value = newPage;
  pageSize.value = newPageSize;
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
    render: (_, row, i) => (
      <div class="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-2">
        <nord-button
          size="s"
          onClick={() => editItem(row.id)}>
          Edit
        </nord-button>
        <nord-button
          variant="danger"
          size="s"
          type="error"
          disabled={removing.value.includes(i) || undefined}
          onClick={() => remove(row)}>
          Remove
        </nord-button>
      </div>
    )
  }
];
</script>
