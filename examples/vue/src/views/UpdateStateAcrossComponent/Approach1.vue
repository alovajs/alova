<template>
  <nord-spinner v-if="loading" />
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
        <h3 class="title">update state by `updateState`</h3>
      </file-viewer>
    </div>
    <div class="grid gap-y-2 text-lg">
      <div>id: {{ data.id }}</div>
      <div>name: {{ data.name }}</div>
      <div>class: {{ data.cls }}</div>
    </div>
    <div slot="footer">
      <edit-card></edit-card>
    </div>
  </nord-card>
</template>

<script setup>
import { useRequest } from 'alova/client';
import { ref } from 'vue';
import { queryStudentDetail } from '../../api/methods';
import FileViewer from '../../components/FileViewer';
import EditCard from './EditCard1';

const filePath = window.__page.source[0];
const docPath = window.__page.doc[0];
const { loading, error, data } = useRequest(queryStudentDetail(1), {
  initialData: {}
});
</script>
