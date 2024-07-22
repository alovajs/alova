<template>
  <div class="flex">
    <nord-checkbox
      v-for="item in checklist"
      :label="item"
      class="mr-4"
      :key="item"
      :value="item"
      :checked="form.checkbox.includes(item) || undefined"
      @input="handleCheckboxChange" />
  </div>
</template>

<script setup>
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
      form.value.checkbox.push(target.value);
    } else {
      form.value.checkbox = form.value.checkbox.filter(item => item !== target.value);
    }
  });
};
</script>
