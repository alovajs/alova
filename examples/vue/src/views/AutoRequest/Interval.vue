<template>
  <div class="grid gap-y-4">
    <FileViewer
      :filePath="filePath"
      :docPath="docPath">
      <nord-banner>It will request every 3 seconds</nord-banner>
    </FileViewer>
    <nord-button
      @click="toggleStop"
      variant="primary">
      <nord-icon
        :class="'mr-2'"
        :name="isStop ? 'interface-play' : 'interface-pause'" />
      {{ isStop ? 'Start Request' : 'Stop Request' }}
    </nord-button>
    <div class="flex">
      <span>Refresh Time: {{ data || '--' }}</span>
      <nord-spinner v-if="loading" />
    </div>
  </div>
</template>

<script setup>
import { useAutoRequest } from 'alova/client';
import { ref } from 'vue';
import { getLatestTime } from '../../api/methods';
import FileViewer from '../../components/FileViewer.vue';

const filePath = window.__page.source[0];
const docPath = window.__page.doc;
const isStop = ref(false);
const { loading, data } = useAutoRequest(getLatestTime, {
  enableNetwork: false,
  enableVisibility: false,
  enableFocus: false,
  pollingTime: 3000,
  middleware(_, next) {
    if (!isStop.value) {
      next();
    }
  }
});

const toggleStop = () => {
  isStop.value = !isStop.value;
};
</script>
