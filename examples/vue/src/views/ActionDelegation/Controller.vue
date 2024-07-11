<template>
  <nord-card>
    <div slot="header">
      <FileViewer
        showPath
        :filePath="filePath"
        :docPath="docPath">
        <h3 class="title">Controller Panel</h3>
      </FileViewer>
    </div>
    <div class="grid gap-y-4">
      <nord-banner>
        Input a suffix and click button, it will trigger the request in `Data Panel` component
      </nord-banner>
      <nord-input
        label="Suffix"
        v-model="suffix" />
      <nord-button @click="handleRefreshSideMenu">Re-request with this suffix</nord-button>
    </div>
  </nord-card>
</template>

<script setup>
import { accessAction } from 'alova/client';
import { ref } from 'vue';
import FileViewer from '../../components/FileViewer';

const filePath = window.__page.source[1];
const docPath = window.__page.doc;
// 使用ref声明响应式变量
const suffix = ref('');

// handleRefreshSideMenu方法用于触发刷新侧边菜单的操作
const handleRefreshSideMenu = () => {
  accessAction('target:data', ({ send }) => send({ suffix: suffix.value }));
};
</script>
