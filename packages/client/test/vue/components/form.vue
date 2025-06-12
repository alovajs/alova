<template>
  <div>
    <span role="isSuccess">isSuccess_{{ isSuccess }}</span>
    <span role="isRestore">isRestore_{{ isRestore }}</span>
    <span role="form">{{ JSON.stringify(form) }}</span>
    <span role="data">{{ JSON.stringify(data) }}</span>
    <button
      role="btnSet"
      @click="handleSet">
      set value
    </button>
    <button
      role="btnReset"
      @click="handleReset">
      reset
    </button>
  </div>
</template>

<script setup lang="ts">
import { useForm } from '@/index';
import { AlovaGenerics, Method } from 'alova';
import { ref } from 'vue';
import { FormHookConfig } from '~/typings/clienthook';

const props = defineProps<{
  handler: (data: any) => Method;
  config: FormHookConfig<AlovaGenerics, any, any>;
}>();

const {
  form,
  onSuccess,
  onRestore,
  data,
  reset: handleReset
} = useForm(props.handler, {
  ...props.config,
  initialForm: {
    name: '',
    age: ''
  }
});
const isRestore = ref(0);
onRestore(() => {
  isRestore.value = 1;
});

const isSuccess = ref(0);
onSuccess(() => {
  isSuccess.value = 1;
});

const handleSet = () => {
  form.value.age = '22';
  form.value.name = 'Hong';
};
</script>
