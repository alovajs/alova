<script>
  import { useCaptcha, useRequest } from 'alova/client';
  import { sendCaptcha, submitForm } from '../api/methods';

  let phone = '';
  let code = '';

  const { loading, countdown, send, error } = useCaptcha(sendCaptcha, {
    initialCountdown: 20
  }).onSuccess(({ data }) => {
    code = data.code;
  });

  const { loading: submitting, send: submitSend } = useRequest(() => submitForm({ phone, code }), {
    immediate: false
  }).onSuccess(({ data }) => {
    alert('Submitted, request body is: ' + JSON.stringify(data));
  });

  const handleCaptchaSend = () => {
    send(phone);
  };
</script>

<nord-card>
  <div class="grid gap-y-4">
    <div class="grid grid-cols-[repeat(2,fit-content(100px))] items-end gap-x-4">
      <nord-input
        label="Phone Number"
        value={phone}
        on:input={({ target }) => (phone = target.value)}
        error={$error?.message} />
      <nord-button
        variant="primary"
        on:click={handleCaptchaSend}
        disabled={(!$loading && $countdown > 0) || undefined}
        loading={$loading || undefined}>
        {#if $countdown > 0}
          {$countdown} after resendable
        {:else}
          Send captcha
        {/if}
      </nord-button>
    </div>
    <nord-input
      label="Your received captcha"
      value={code}
      on:input={({ target }) => (code = target.value)} />
    <nord-button
      variant="primary"
      loading={$submitting || undefined}
      on:click={submitSend}>
      Submit
    </nord-button>
  </div>
</nord-card>
