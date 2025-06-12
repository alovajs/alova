<template>
  <nord-input
    label="Input something"
    v-model="form.input" />
</template>

<script setup>
import { useForm } from 'alova/client';
import { submitForm } from '../../../api/methods';

const formId = 'multi-form-id';
// 通过获得id为multi-form-id的共享数据
const { form } = useForm(form => submitForm(form), {
  id: formId
});
console.log(form.value);
</script>
