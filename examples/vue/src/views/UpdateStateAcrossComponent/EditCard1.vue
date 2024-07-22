<template>
  <div class="border-t-[1px] pt-4 border-slate-200 grid grid-rows-3 gap-y-4">
    <nord-input
      label="name"
      v-model="name"
      expand></nord-input>
    <nord-input
      label="class"
      v-model="cls"
      expand></nord-input>

    <nord-button
      variant="primary"
      expand
      @click="handleUpdateState">
      Submit to update the above info
    </nord-button>
  </div>
</template>

<script setup>
import { updateState } from 'alova/client';
import { ref } from 'vue';
import { queryStudentDetail } from '../../api/methods';

const name = ref('');
const cls = ref('');
const handleUpdateState = () => {
  // update state
  updateState(queryStudentDetail(1), oldData => {
    return {
      ...oldData,
      name: name.value,
      cls: cls.value
    };
  });
};
</script>
