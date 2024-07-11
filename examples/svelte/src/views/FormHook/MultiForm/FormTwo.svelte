<script>
  import { useForm } from 'alova/client';
  import { submitForm } from '../../../api/methods';

  const options = ['Option 1', 'Option 2', 'Option 3'];
  const formId = 'multi-form-id';
  // 通过获得id为multi-form-id的共享数据
  const { form } = useForm(form => submitForm(form), {
    id: formId
  });

  const handleToggleChange = ({ target }) => {
    setTimeout(() => {
      $form.switch = target.checked;
    });
  };
</script>

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
  on:change={({ target }) => ($form.date = target.value)} />
<nord-toggle
  checked={$form.switch}
  label="Switch this"
  on:input={handleToggleChange} />
