<template>
  <div class="border-t-[1px] pt-4 border-slate-200 grid grid-rows-3 gap-y-4">
    <nord-input
      label="name"
      :value="name"
      @input="event => (name = event.target.value)"
      expand></nord-input>
    <nord-input
      label="class"
      :value="cls"
      @input="event => (cls = event.target.value)"
      expand></nord-input>

    <nord-button
      variant="primary"
      expand
      :disabled="submiting || fetching"
      @click="handleRefetch">
      {{ submiting ? 'Submiting...' : fetching ? 'Fetching...' : 'Submit to update the above info' }}
    </nord-button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useFetcher, useRequest } from 'alova/client';
import { editStudent, queryStudentDetail } from '../../api/methods';

const props = defineProps({
  id: {
    type: Number,
    required: true
  }
});

const name = ref('');
const cls = ref('');

const { loading: submiting, send } = useRequest(() => editStudent(name.value, cls.value, props.id), {
  immediate: false
});

const { loading: fetching, fetch } = useFetcher({ force: true });

const handleRefetch = async () => {
  await send();
  fetch(queryStudentDetail(props.id));
};
</script>
