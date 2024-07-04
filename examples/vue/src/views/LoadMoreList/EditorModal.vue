<template>
  <div
    class="grid gap-y-4"
    v-if="!loading">
    <nord-input
      label="Name"
      v-model="detail.name" />
    <nord-select
      label="Class"
      v-model="detail.cls">
      <option
        v-for="option in classOptions"
        :key="option.value"
        :value="option.value">
        {{ option.title }}
      </option>
    </nord-select>
    <nord-button
      variant="primary"
      @click="submitStudent"
      :loading="submitting || undefined">
      Submit
    </nord-button>
  </div>
  <nord-spinner v-else />
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { useRequest } from 'alova/client';
import { editStudent, queryStudentDetail } from '../../api/methods';

const props = defineProps({
  id: {
    type: Number,
    required: false
  }
});
const emit = defineEmits(['submit']);

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

const {
  loading,
  data: detail,
  update
} = useRequest(() => queryStudentDetail(props.id), {
  initialData: {
    name: 'newName',
    cls: 'class1'
  },
  immediate: !!props.id
});

const { loading: submitting, send: sendStudentAdd } = useRequest(
  () => editStudent(detail.value.name, detail.value.cls, props.id),
  {
    immediate: false
  }
);

const submitStudent = async () => {
  if (!detail.value.name) {
    alert('Please input student name');
    return;
  }
  const newId = await sendStudentAdd();
  emit('submit', {
    ...detail.value,
    id: newId || detail.value.id
  });
};
</script>
