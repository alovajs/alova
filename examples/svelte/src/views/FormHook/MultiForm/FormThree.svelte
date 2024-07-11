<script>
  import { useForm } from 'alova/client';
  import { submitForm } from '../../../api/methods';

  const formId = 'multi-form-id';
  const checklist = ['apple', 'banana', 'grape'];

  // 通过获得id为multi-form-id的共享数据
  const { form } = useForm(form => submitForm(form), {
    id: formId
  });

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

<div class="flex">
  {#each checklist as item}
    <nord-checkbox
      label={item}
      class="mr-4"
      key={item}
      value={item}
      checked={$form.checkbox.includes(item)}
      on:input={handleCheckboxChange} />
  {/each}
</div>
