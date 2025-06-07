<template>
  <nord-card>
    <div slot="header">
      <FileViewer
        :filePath="filePath"
        :docPath="docPath">
        <h3 class="title">[Select File] open a native dialog</h3>
      </FileViewer>
    </div>
    <div class="grid gap-y-4">
      <div class="flex">
        <label class="mr-3">file format</label>
        <nord-checkbox
          v-for="item in acceptOptions"
          :class="'mr-4'"
          :label="item"
          :key="item"
          :value="item"
          :checked="accept.includes(item) || undefined"
          @input="handleCheckboxChange" />
      </div>
      <nord-toggle
        :checked="multiple || undefined"
        label="select multiple files"
        @input="handleToggleChange" />

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
      <div class="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-4">
        <nord-button
          variant="primary"
          @click="handleAppendFiles">
          Select File
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
import { ref } from 'vue';
import { uploadFiles } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

const acceptOptions = ['.jpg', '.png', '.xlsx'];
const filePath = window.__page.source[0];
const docPath = window.__page.doc;

const accept = ref([]);
const multiple = ref(false);

const { fileList, upload, appendFiles, removeFiles, uploading } = useUploader(uploadFiles, {
  limit: 3,
  localLink: true
});

const statusText = status => ['wait upload', 'uploading...', 'upload success', 'upload fail'][status];

const handleAppendFiles = () => {
  appendFiles({
    accept: accept.value.join(),
    multiple: multiple.value
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
</script>
