<template>
  <nord-card>
    <div class="grid gap-y-4">
      <div class="grid grid-cols-[repeat(2,fit-content(100px))] items-end gap-x-4">
        <nord-input
          label="Phone Number"
          v-model="phone" />
        <nord-button
          variant="primary"
          @click="handleCaptchaSend"
          :disabled="(!loading && countdown > 0) || undefined"
          :loading="loading || undefined">
          {{ countdown > 0 ? `${countdown} after resendable` : 'Send captcha' }}
        </nord-button>
      </div>
      <nord-input
        label="Your received captcha"
        v-model="code" />
      <nord-button
        variant="primary"
        :loading="submiting || undefined"
        @click="submitSend">
        Submit
      </nord-button>
    </div>
  </nord-card>
</template>

<script setup>
import { useCaptcha, useRequest } from 'alova/client';
import { ref } from 'vue';
import { sendCaptcha, submitForm } from '../api/methods';

const phone = ref('');
const code = ref('');

const { loading, countdown, send } = useCaptcha(sendCaptcha, {
  initialCountdown: 20
}).onSuccess(({ data }) => {
  code.value = data.code;
});

const { loading: submiting, send: submitSend } = useRequest(
  () => submitForm({ phone: phone.value, code: code.value }),
  {
    immediate: false
  }
).onSuccess(({ data }) => {
  alert('Submited, request body is: ' + JSON.stringify(data));
});

const handleCaptchaSend = () => {
  send(phone.value);
};
</script>
