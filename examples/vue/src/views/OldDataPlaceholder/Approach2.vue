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
        <h3 class="title">Use `middleware`</h3>
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

const cacheKey = 'placeholder-cache2';
const filePath = window.__page.source[1];
const docPath = window.__page.doc[1];
const methodOfQueryRandom = queryRandom();
const {
  loading,
  error,
  data: randomNumbers
} = useRequest(methodOfQueryRandom, {
  initialData: [],
  async middleware({ proxyStates, method }, next) {
    const { data } = proxyStates;
    const cache = method.context.l2Cache.get(cacheKey);
    if (cache) {
      data.v = cache;
    }
    const res = await next();
    method.context.l2Cache.set(cacheKey, res);
    return res;
  }
});

const handleReload = () => location.reload();
const handleClearCache = () => {
  alova.l2Cache.remove(cacheKey);
  showToast('Cache is cleared');
};
</script>
