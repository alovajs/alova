<template>
  <div class="flex flex-col items-start">
    <div class="flex flex-row items-end">
      <nord-input
        label="What is your favorite fruits?"
        v-model="fruit"></nord-input>
      <nord-button
        class="ml-2"
        variant="primary"
        :loading="submiting || undefined"
        @click="submitFruit">
        Submit
      </nord-button>
    </div>
    <span
      v-if="error"
      class="text-red-500"
      >{{ error.message }}</span
    >

    <div class="mt-4 grid grid-cols-[repeat(8,fit-content(100px))] gap-2">
      <nord-badge
        v-for="item in fruitsList"
        :key="item"
        variant="success">
        {{ item }}
      </nord-badge>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRequest } from 'alova/client';
import { addFruit } from '../api/methods';
import { showToast } from '../helper';

const fruit = ref('');
const fruitsList = ref([]);

const {
  loading: submiting,
  error,
  send
} = useRequest(() => addFruit(fruit.value), {
  immediate: false
}).onSuccess(({ data }) => {
  fruitsList.value = [...fruitsList.value, data.added];
  fruit.value = '';
});

const submitFruit = () => {
  if (!fruit.value) {
    showToast('Please input a fruit');
    return;
  }
  send();
};
</script>
