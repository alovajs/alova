<template>
  <nord-card>
    <div slot="header">
      <FileViewer
        :filePath="filePath"
        :docPath="docPath">
        <h3 class="title">[Multiple steps form] Fill step by step, and submit all data in final step</h3>
      </FileViewer>
    </div>
    <div class="grid gap-y-4">
      <strong>Step {{ currentStep + 1 }}</strong>
      <component :is="formComponents[currentStep]" />
      <div class="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-4">
        <nord-button
          v-if="currentStep > 0 && currentStep < formComponents.length"
          @click="subCurreentStep"
          >Previous</nord-button
        >
        <nord-button
          v-if="currentStep < formComponents.length - 1"
          variant="primary"
          @click="addCurreentStep">
          Next
        </nord-button>
        <nord-button
          v-else
          variant="primary"
          :loading="submiting || undefined"
          @click="send">
          Submit
        </nord-button>
      </div>
    </div>
  </nord-card>
</template>

<script setup>
import { useForm } from 'alova/client';
import { ref } from 'vue';
import { submitForm } from '../../../api/methods';
import FileViewer from '../../../components/FileViewer';
import FormOne from './FormOne';
import FormThree from './FormThree';
import FormTwo from './FormTwo';

const filePath = window.__page.source[2];
const docPath = window.__page.doc;
const initialForm = {
  input: '',
  select: '',
  date: undefined,
  switch: false,
  checkbox: []
};
const formId = 'multi-form-id';

/**
 * multiple steps form
 */
const formComponents = [FormOne, FormTwo, FormThree];
const currentStep = ref(0);
const addCurreentStep = () => {
  currentStep.value += 1;
};
const subCurreentStep = () => {
  currentStep.value -= 1;
};

const { send, loading: submiting } = useForm(form => submitForm(form), {
  id: formId,
  initialForm,
  resetAfterSubmiting: true
}).onSuccess(({ data }) => {
  alert('Submited, request body is: ' + JSON.stringify(data));
});
</script>
