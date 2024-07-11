<template>
  <div class="responsive">
    <Table
      :title="'Please select one item and modify it.'"
      :loading="loading"
      :columns="columns"
      :data="students.list"
      :row-props="rowProps" />
    <nord-modal
      :open="showDetail || undefined"
      @close="showDetail = false"
      title="Student Info">
      <student-info-modal
        v-if="showDetail"
        :id="viewingId"
        @close="handleModalClose" />
    </nord-modal>
    <nord-card>
      <h3
        slot="header"
        class="title">
        Cache invalidating Records
      </h3>
      <div class="flex flex-col leading-6">
        <span
          v-for="msg in cacheInvalidatingRecords"
          :key="msg"
          >{{ msg }}</span
        >
      </div>
    </nord-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRequest } from 'alova/client';
import { alova } from '../../api';
import { editStudent, queryStudentDetail, queryStudents } from '../../api/methods';
import Table from '../../components/Table';
import StudentInfoModal from './StudentInfoModal';

const showDetail = ref(false);
const viewingId = ref(0);
const cacheInvalidatingRecords = ref([]);
const {
  loading,
  data: students,
  send
} = useRequest(queryStudents, {
  initialData: {
    list: [],
    total: 0
  }
});

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
    dataIndex: 'cls'
  }
];

const rowProps = row => ({
  style: {
    cursor: 'pointer'
  },
  onClick: () => {
    handleDetailShow(row.id);
  }
});

const handleDetailShow = id => {
  viewingId.value = id;
  showDetail.value = true;
};

onMounted(() => {
  const offHandler = alova.l1Cache.emitter.on('success', event => {
    if (event.type === 'remove') {
      cacheInvalidatingRecords.value.push(
        `[${cacheInvalidatingRecords.value.length + 1}]. The cache of key \`${event.key}\` has been removed.`
      );
    }
  });
  return offHandler;
});

const handleModalClose = isSubmit => {
  showDetail.value = false;
  if (isSubmit) {
    send();
  }
};
</script>
