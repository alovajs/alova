<template>
  <div>
    <Table
      title="Please click the same item twice."
      :loading="loading"
      :columns="columns"
      :data="students.list"
      :row-props="rowProps" />
    <nord-modal
      :open="showDetail"
      @close="showDetail = false">
      <student-info-modal
        v-if="showDetail"
        :id="viewingId" />
    </nord-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRequest } from 'alova/client';
import { queryStudents } from '../../api/methods';
import Table from '../../components/Table';
import { useEvent } from '../../helper';
import StudentInfoModal from './StudentInfoModal';

const showDetail = ref(false);
const viewingId = ref(0);

const { loading, data: students } = useRequest(queryStudents, {
  initialData: {
    list: [],
    total: 0
  },
  immediate: true
});

const handleDetailShow = id => {
  viewingId.value = id;
  showDetail.value = true;
};

const columns = [
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
</script>
