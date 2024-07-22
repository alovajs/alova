<template>
  <nord-spinner v-if="loading && randomNumbers.length <= 0" />
  <span
    v-else-if="error"
    class="text-red-500"
    >{{ error.message }}</span
  >
  <nord-card v-else>
    <div slot="header">
      <file-viewer
        :file-path="filePath"
        :doc-path="docPath">
        <h3 class="title">Use `initialData` function</h3>
      </file-viewer>
    </div>
    <div class="grid gap-2 grid-cols-[fit-content(100px)_fit-content(100px)] mb-4">
      <nord-button @click="handleReload">Reload page</nord-button>
      <nord-button @click="handleClearCache">Clear Cache</nord-button>
    </div>
    <div class="flex flex-row">
      <nord-badge
        v-for="num in randomNumbers"
        :key="num"
        class="mr-2">
        {{ num }}
      </nord-badge>
    </div>
  </nord-card>
</template>

<script setup>
import { useRequest } from 'alova/client';
import { alova } from '../../api';
import { queryRandom } from '../../api/methods';
import FileViewer from '../../components/FileViewer';
import { showToast } from '../../helper';

const filePath = window.__page.source[0];
const docPath = window.__page.doc[0];
const cacheKey = 'placeholder-cache';
const methodOfQueryRandom = queryRandom();
const {
  loading,
  error,
  data: randomNumbers
} = useRequest(methodOfQueryRandom, {
  initialData() {
    const cache = alova.l2Cache.get(cacheKey);
    return cache || [];
  }
}).onSuccess(({ data }) => {
  alova.l2Cache.set(cacheKey, data);
});

const handleReload = () => location.reload();
const handleClearCache = () => {
  alova.l2Cache.remove(cacheKey);
  showToast('Cache is cleared');
};
</script>
