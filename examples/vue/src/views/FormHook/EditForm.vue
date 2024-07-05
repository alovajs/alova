<template>
  <nord-card>
    <div slot="header">
      <FileViewer
        :filePath="filePath"
        :docPath="docPath">
        <nord-spinner
          v-if="loading"
          class="mr-4" />
        <h3 class="title">Load editing data</h3>
      </FileViewer>
    </div>
    <div class="grid gap-y-4">
      <nord-input
        label="Input something"
        v-model="form.input" />
      <nord-select
        label="Select"
        v-model="form.select"
        placeholder="not selected">
        <option
          v-for="option in options"
          :key="option"
          :value="option">
          {{ option }}
        </option>
      </nord-select>
      <nord-date-picker
        label="Date"
        placeholder="YYYY-MM-DD"
        :value="form.date"
        @change="({ target }) => updateForm({ date: target.value })" />
      <nord-toggle
        :checked="form.switch || undefined"
        @input="handleToggleChange"
        label="Switch this" />
      <div class="flex">
        <nord-checkbox
          v-for="item in checklist"
          :key="item"
          class="mr-4"
          :label="item"
          :value="item"
          :checked="form.checkbox.includes(item)"
          @input="handleCheckboxChange"></nord-checkbox>
      </div>
      <div class="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-4">
        <nord-button
          variant="primary"
          :loading="submiting"
          @click="send">
          Submit
        </nord-button>
        <nord-button @click="reset">Reset</nord-button>
      </div>
    </div>
  </nord-card>
</template>

<script setup>
import { useForm, useRequest } from 'alova/client';
import { getConfiguration, submitForm } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

const options = ['Option 1', 'Option 2', 'Option 3'];
const checklist = ['apple', 'banana', 'grape'];
const filePath = window.__page.source[1];
const docPath = window.__page.doc;

/**
 * editing form
 */
const {
  form,
  send,
  updateForm,
  reset,
  loading: submiting
} = useForm(form => submitForm(form), {
  initialForm: {
    input: '',
    select: '',
    date: undefined,
    switch: false,
    checkbox: []
  },
  resetAfterSubmiting: true
}).onSuccess(({ data }) => {
  alert('Submited, request body is: ' + JSON.stringify(data));
});

// get the detailed data
const { loading } = useRequest(getConfiguration).onSuccess(({ data }) => {
  updateForm(data);
});

const handleToggleChange = ({ target }) => {
  setTimeout(() => {
    updateForm({ switch: target.checked });
  });
};

const handleCheckboxChange = ({ target }) => {
  setTimeout(() => {
    if (target.checked) {
      form.value.checkbox.push(target.value);
    } else {
      form.value.checkbox = form.value.checkbox.filter(item => item !== target.value);
    }
  });
};
</script>
