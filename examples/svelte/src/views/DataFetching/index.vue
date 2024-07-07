<!-- View.vue -->
<template>
  <div class="relative">
    <div
      v-if="fetching"
      class="flex items-center absolute top-4 right-4 z-50">
      <nord-spinner
        size="l"
        class="mr-4"></nord-spinner>
      <span class="font-bold">Fetching...</span>
    </div>

    <Table
      title="Mouse move to items below, it will prefetch detail data."
      :loading="loading"
      :columns="[
        {
          title: 'Name',
          dataIndex: 'name'
        },
        {
          title: 'Class',
          dataIndex: 'cls'
        }
      ]"
      :data="students.list"
      :rowProps="
        row => ({
          style: {
            cursor: 'pointer'
          },
          onClick: () => handleDetailShow(row.id),
          onMouseenter: () => handleFetchDetail(row.id),
          onMouseleave: () => handleRemoveFetch(row.id)
        })
      ">
    </Table>
    <nord-modal
      :open="showDetail"
      @close="showDetail = false">
      <edit-modal
        v-if="showDetail"
        :id="viewingId" />
    </nord-modal>
  </div>
</template>

<script setup>
import { useFetcher, useRequest } from 'alova/client';
import { ref } from 'vue';
import { queryStudentDetail, queryStudents } from '../../api/methods';
import Table from '../../components/Table';
import EditModal from './EditModal';

const showDetail = ref(false);
const viewingId = ref(0);
const { loading, data: students } = useRequest(queryStudents, {
  initialData: {
    list: [],
    total: 0
  },
  immediate: true
});

const timers = {};
const { fetch, loading: fetching } = useFetcher();
// Prefetch detail data when staying for more than 200 milliseconds
const handleFetchDetail = id => {
  timers[id] = setTimeout(() => {
    fetch(queryStudentDetail(id));
  }, 200);
};
const handleRemoveFetch = id => {
  if (timers[id]) {
    clearTimeout(timers[id]);
    delete timers[id];
  }
};

const handleDetailShow = id => {
  viewingId.value = id;
  showDetail.value = true;
};
</script>
