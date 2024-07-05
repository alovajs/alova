<template>
  <nord-card>
    <div slot="header">
      <FileViewer
        showPath
        :filePath="filePath"
        :docPath="docPath">
        <h3 class="title">Data Panel</h3>
      </FileViewer>
    </div>
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
  </nord-card>
</template>

<script setup>
import { actionDelegationMiddleware, useRequest } from 'alova/client';
import { getData } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

const filePath = window.__page.source[0];
const docPath = window.__page.doc;
// 使用useRequest获取数据
const { data, loading, error } = useRequest(getData, {
  initialData: [],
  middleware: actionDelegationMiddleware('target:data')
});
</script>
