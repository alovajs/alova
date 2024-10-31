<template>
  <nord-card>
    <div slot="header">
      <FileViewer
        :filePath="filePath"
        :docPath="docPath">
        <h3 class="title">List condition search with storing</h3>
      </FileViewer>
    </div>
    <div class="grid lg:grid-cols-[repeat(3,auto)] items-end gap-4 mb-4">
      <nord-input
        label="Search Area"
        v-model="form.search"
        @blur="send" />
      <nord-select
        label="Select City"
        placeholder="not selected"
        v-model="form.city"
        @input="send">
        <option
          v-for="option in cityOptions"
          :key="option.value"
          :value="option.value">
          {{ option.label }}
        </option>
      </nord-select>
      <nord-button
        :loading="loading"
        @click="handleReset">
        Reset
      </nord-button>
    </div>
    <div class="grid grid-cols-[repeat(auto-fill,60px)] gap-2">
      <nord-badge
        v-for="{ label } in areaList"
        :key="label"
        variant="info">
        {{ label }}
      </nord-badge>
    </div>
  </nord-card>
</template>

<script setup>
import { useForm } from 'alova/client';
import { getCityArea } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

const filePath = window.__page.source[3];
const docPath = window.__page.doc;
const cityOptions = [
  {
    value: 'bj',
    label: '北京'
  },
  {
    value: 'sh',
    label: '上海'
  }
];

/**
 * Confition filter form
 */
const {
  form,
  send,
  updateForm,
  reset,
  data: areaList,
  loading
} = useForm(getCityArea, {
  initialForm: {
    search: '',
    city: undefined
  },
  initialData: [],
  immediate: true,
  store: true
});

const handleReset = () => {
  reset();
  setTimeout(send, 20);
};
</script>
