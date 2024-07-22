<script>
  import { useForm } from 'alova/client';
  import { submitForm } from '../../../api/methods';
  import FileViewer from '../../../components/FileViewer.svelte';
  import FormOne from './FormOne.svelte';
  import FormThree from './FormThree.svelte';
  import FormTwo from './FormTwo.svelte';

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
  let currentStep = 0;

  const addCurrentStep = () => {
    currentStep++;
  };
  const subCurrentStep = () => {
    currentStep--;
  };

  const {
    send,
    loading: submiting,
    form
  } = useForm(form => submitForm(form), {
    id: formId,
    initialForm,
    resetAfterSubmiting: true
  }).onSuccess(({ data }) => {
    alert('Submitted, request body is: ' + JSON.stringify(data));
  });
</script>

<nord-card>
  <div slot="header">
    <FileViewer
      {filePath}
      {docPath}>
      <h3 class="title">[Multiple steps form] Fill step by step, and submit all data in final step</h3>
    </FileViewer>
  </div>
  <div class="grid gap-y-4">
    <strong>Step {currentStep + 1}</strong>
    <svelte:component this={formComponents[currentStep]} />
    <div class="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-4">
      {#if currentStep > 0 && currentStep < formComponents.length}
        <nord-button on:click={subCurrentStep}>Previous</nord-button>
      {/if}
      {#if currentStep < formComponents.length - 1}
        <nord-button
          variant="primary"
          on:click={addCurrentStep}>Next</nord-button>
      {/if}
      {#if currentStep === formComponents.length - 1}
        <nord-button
          variant="primary"
          loading={$submiting || undefined}
          on:click={send}>Submit</nord-button>
      {/if}
    </div>
  </div>
</nord-card>
