<template>
  <div class="grid gap-y-4">
    <div class="flex items-center">
      <nord-input
        class="mr-4"
        v-model="studentName"
        hide-label
        placeholder="Input student name"
        clearable />
      <nord-select
        class="mr-4"
        v-model="clsName"
        hide-label
        placeholder="Select class">
        <option value="class1">class 1</option>
        <option value="class2">class 2</option>
        <option value="class3">class 3</option>
      </nord-select>
    </div>
    <Table
      :loading="loading"
      :columns="columns"
      :data="students.list"></Table>
  </div>
</template>

<script setup>
import { useWatcher } from 'alova/client';
import { ref } from 'vue';
import { queryStudents } from '../api/methods';
import Table from '../components/Table.vue';

const studentName = ref('');
const clsName = ref('');

const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    width: 10
  },
  {
    title: 'Class',
    dataIndex: 'cls',
    width: 100
  }
];

const { loading, data: students } = useWatcher(
  () => queryStudents(1, 10, studentName.value || '', clsName.value || ''),
  [studentName, clsName],
  {
    initialData: {
      total: 0,
      list: []
    },
    debounce: [500],
    immediate: true
  }
);
</script>
