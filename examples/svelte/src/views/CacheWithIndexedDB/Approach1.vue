<template>
  <nord-card>
    <div slot="header">
      <file-viewer
        :file-path="filePath"
        :doc-path="docPath">
        <h3 class="title">Custom `l2Cache` adapter</h3>
      </file-viewer>
    </div>
    <div class="grid gap-y-2">
      <p>Please select an image</p>
      <nord-button-group>
        <nord-button
          v-for="img in imageList"
          :key="img"
          @click="showImage(img)">
          {{ img }}
        </nord-button>
      </nord-button-group>

      <template v-if="loading">
        <nord-spinner size="s" />
      </template>
      <template v-else-if="error">
        <span>{{ error.message }}</span>
      </template>
      <template v-else-if="data">
        <img
          :src="data"
          alt="Selected" />
      </template>
    </div>
  </nord-card>
</template>

<script setup>
import { ref } from 'vue';
import { useRequest } from 'alova/client';
import { imagePlain } from '../../api/methods';
import FileViewer from '../../components/FileViewer.vue';

const imageList = ['1.jpg', '2.jpg'];
const filePath = window.__page.source[0];
const docPath = window.__page.doc[0];
const {
  data,
  loading,
  error,
  send: showImage
} = useRequest(fileName => imagePlain(fileName), {
  immediate: false
});
</script>
