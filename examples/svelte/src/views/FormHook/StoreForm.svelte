<script>
  import { useForm } from 'alova/client';
  import { submitForm } from '../../api/methods';
  import FileViewer from '../../components/FileViewer.svelte';

  const options = ['Option 1', 'Option 2', 'Option 3'];
  const checklist = ['apple', 'banana', 'grape'];
  const filePath = window.__page.source[0];
  const docPath = window.__page.doc;

  /**
   * form with draft
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
    store: true,
    resetAfterSubmiting: true
  }).onSuccess(({ data }) => {
    alert('Submitted, request body is: ' + JSON.stringify(data));
  });

  const handleToggleChange = ({ target }) => {
    setTimeout(() => {
      updateForm({ switch: target.checked });
    });
  };

  const handleCheckboxChange = ({ target }) => {
    setTimeout(() => {
      if (target.checked) {
        $form.checkbox = [...$form.checkbox, target.value];
      } else {
        $form.checkbox = $form.checkbox.filter(item => item !== target.value);
      }
    });
  };
</script>

<nord-card>
  <div slot="header">
    <FileViewer
      {filePath}
      {docPath}>
      <h3 class="title">[Draft form] Data will be stored until submit them</h3>
    </FileViewer>
  </div>
  <div class="grid gap-y-4">
    <nord-input
      label="Input something"
      value={$form.input}
      on:input={({ target }) => ($form.input = target.value)} />
    <nord-select
      label="Select"
      value={$form.select}
      on:input={({ target }) => ($form.select = target.value)}
      placeholder="not selected">
      {#each options as option}
        <option value={option}>
          {option}
        </option>
      {/each}
    </nord-select>
    <nord-date-picker
      label="Date"
      placeholder="YYYY-MM-DD"
      value={$form.date}
      on:change={({ target }) => updateForm({ date: target.value })} />
    <nord-toggle
      checked={$form.switch}
      label="Switch this"
      on:input={handleToggleChange} />
    <div class="flex">
      {#each checklist as item}
        <nord-checkbox
          class="mr-4"
          label={item}
          value={item}
          checked={$form.checkbox.includes(item)}
          on:input={handleCheckboxChange} />
      {/each}
    </div>
    <div class="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-4">
      <nord-button
        variant="primary"
        loading={$submiting}
        on:click={send}>
        Submit
      </nord-button>
      <nord-button on:click={reset}>Reset</nord-button>
    </div>
  </div>
</nord-card>
