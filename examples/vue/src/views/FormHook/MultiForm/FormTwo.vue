<template>
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
    label="Switch this"
    @input="handleToggleChange" />
</template>

<script setup>
import { useForm } from 'alova/client';
import { submitForm } from '../../../api/methods';

const options = ['Option 1', 'Option 2', 'Option 3'];
const formId = 'multi-form-id';
// 通过获得id为multi-form-id的共享数据
const { form, updateForm } = useForm(form => submitForm(form), {
  id: formId
});

const handleToggleChange = ({ target }) => {
  setTimeout(() => {
    updateForm({ switch: target.checked });
  });
};
</script>
