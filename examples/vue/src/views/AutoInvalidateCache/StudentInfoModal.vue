<template>
  <h3 slot="header">Edit Info</h3>
  <div>
    <nord-spinner v-if="loading" />
    <div
      v-else
      class="grid gap-4 text-base">
      <nord-banner>From cache: {{ fromCache ? 'Yes' : 'No' }}</nord-banner>
      <nord-input
        label="name"
        v-model="detail.name"></nord-input>
      <nord-input
        label="class"
        v-model="detail.cls"></nord-input>
    </div>
  </div>
  <nord-button-group
    slot="footer"
    variant="spaced">
    <nord-button
      @click="emit('close')"
      expand
      id="cancelButton"
      >Cancel</nord-button
    >
    <nord-button
      expand
      id="confirmButton"
      variant="primary"
      :loading="submiting || undefined"
      @click="handleSubmit">
      Save changes
    </nord-button>
  </nord-button-group>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRequest } from 'alova/client';
import { editStudent, queryStudentDetail } from '../../api/methods';

const props = defineProps({
  id: {
    type: Number,
    required: true
  }
});
const emit = defineEmits(['close']);

const fromCache = ref(false);
const {
  loading,
  data: detail,
  update
} = useRequest(queryStudentDetail(props.id), {
  initialData: {}
}).onSuccess(event => {
  fromCache.value = event.fromCache;
});

const { loading: submiting, send: submit } = useRequest(
  () => editStudent(detail.value.name, detail.value.cls, props.id),
  {
    immediate: false
  }
);

const handleSubmit = async () => {
  await submit();
  emit('close', true);
};
</script>
