<template>
  <div>
    <nord-spinner
      v-if="loading"
      size="s" />
    <div v-else-if="error">{{ error.message }}</div>
    <div
      v-else
      class="grid grid-cols-[repeat(8,fit-content(100px))] gap-2">
      <nord-badge
        v-for="item in data"
        :key="item"
        class="mr-2"
        variant="success">
        {{ item }}
      </nord-badge>
    </div>
  </div>
</template>

<script setup>
import { useRequest } from 'alova/client';
import { getData } from '../api/methods';

const { data, loading, error } = useRequest(getData, {
  initialData: []
});
</script>
