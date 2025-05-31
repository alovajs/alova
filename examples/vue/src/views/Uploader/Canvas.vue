<template>
  <nord-card>
    <div slot="header">
      <FileViewer
        :filePath="filePath"
        :docPath="docPath">
        <h3 class="title">Upload canvas as image</h3>
      </FileViewer>
    </div>
    <div class="grid gap-y-4">
      <canvas
        width="200"
        height="200"
        ref="canvas"></canvas>
      <div class="flex">
        <div
          v-for="(file, index) in fileList"
          class="relative mr-2"
          :key="index">
          <nord-icon
            name="interface-close"
            class="absolute top-2 right-2 cursor-pointer"
            @click="removeFiles(file)" />
          <img
            class="w-32"
            :src="file.src" />
          <div>{{ file.progress.uploaded + '/' + file.progress.total }}</div>
          <div>{{ statusText(file.status) }}</div>
        </div>
      </div>
      <div class="grid grid-cols-[repeat(3,fit-content(100px))] gap-x-4">
        <nord-button
          @click="handleRandomDraw"
          variant="dashed"
          >Random Draw</nord-button
        >
        <nord-button
          variant="primary"
          @click="handleAppendFiles">
          Add Canvas
        </nord-button>
        <nord-button
          @click="upload()"
          :disabled="uploading || undefined"
          >Do Upload</nord-button
        >
      </div>
    </div>
  </nord-card>
</template>

<script setup>
import { useUploader } from 'alova/client';
import { onMounted, useTemplateRef } from 'vue';
import { uploadFiles } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

const filePath = window.__page.source[1];
const docPath = window.__page.doc;

const { fileList, upload, appendFiles, removeFiles, uploading } = useUploader(uploadFiles, {
  limit: 3,
  localLink: true
});

const statusText = status => ['wait upload', 'uploading...', 'upload success', 'upload fail'][status];
const canvasRef = useTemplateRef('canvas');

const handleAppendFiles = () => {
  appendFiles({
    file: canvasRef.value
  });
};

const handleToggleChange = ({ target }) => {
  setTimeout(() => {
    multiple.value = target.checked;
  });
};

const handleCheckboxChange = ({ target }) => {
  setTimeout(() => {
    if (target.checked) {
      accept.value.push(target.value);
    } else {
      accept.value = accept.value.filter(item => item !== target.value);
    }
  });
};

const handleRandomDraw = () => {
  const ctx = canvasRef.value.getContext('2d');
  ctx.fillStyle = '#eee';
  ctx.fillRect(0, 0, 200, 200);
  ctx.fillStyle = '#' + Math.floor(Math.random() * 16777215).toString(16);
  ctx.fillRect(Math.floor(Math.random() * 200), Math.floor(Math.random() * 200), 30, 30);
};
onMounted(handleRandomDraw);
</script>
