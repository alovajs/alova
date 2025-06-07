<template>
  <nord-card>
    <div slot="header">
      <FileViewer
        :filePath="filePath"
        :docPath="docPath">
        <h3 class="title">Upload file of {{ fileFormat }}</h3>
      </FileViewer>
    </div>
    <div class="grid gap-y-4">
      <nord-input
        label="Type something and auto transform to File while uploading"
        v-model="content"></nord-input>
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
          Add File
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
import { defineProps, ref } from 'vue';
import { uploadFiles } from '../../api/methods';
import FileViewer from '../../components/FileViewer';
import { showToast } from '../../helper';

const props = defineProps({
  fileFormat: {
    required: true,
    type: String
  }
});

const filePath = window.__page.source[2];
const docPath = window.__page.doc;

const content = ref('');
const { fileList, upload, appendFiles, removeFiles, uploading } = useUploader(uploadFiles, {
  limit: 3
});

const statusText = status => ['wait upload', 'uploading...', 'upload success', 'upload fail'][status];

const dataConverter = {
  file: () => new File([content.value], 'test.txt'),
  blob: () => new Blob([content.value], { type: 'text/plain' }),
  base64: () => content.value,
  arraybuffer: () => {
    const encoder = new TextEncoder();
    return encoder.encode(content.value).buffer;
  }
};

const handleAppendFiles = () => {
  const data = dataConverter[props.fileFormat.toLowerCase()]();
  showToast(`receive a file which is '${data.toString()}'`, {
    autoDismiss: 4000
  });
  appendFiles({
    file: data,
    name: data.name || 'file'
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
