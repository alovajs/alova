import { useCaptcha, useRequest } from 'alova/client';
import { createSignal } from 'solid-js';
import { sendCaptcha, submitForm } from '../api/methods';

function View() {
  const [phone, setPhone] = createSignal('');
  const [code, setCode] = createSignal('');
  const { loading, countdown, send, error } = useCaptcha(sendCaptcha, {
    initialCountdown: 20
  }).onSuccess(({ data }) => {
    setCode(data.code);
  });

  const { loading: submiting, send: submitSend } = useRequest(() => submitForm({ phone: phone(), code: code() }), {
    immediate: false
  }).onSuccess(({ data }) => {
    alert(`Submitted, request body is: ${JSON.stringify(data)}`);
  });

  return (
    <nord-card>
      <div class="grid gap-y-4">
        <div class="grid grid-cols-[repeat(2,fit-content(100px))] items-end gap-x-4">
          <nord-input
            label="Phone Number"
            value={phone()}
            error={error?.message}
            onInput={({ target }) => {
              setPhone(target.value);
            }}
          />
          <nord-button
            variant="primary"
            onClick={() => send(phone())}
            disabled={(!loading() && countdown() > 0) || undefined}
            loading={loading() || undefined}>
            {countdown() > 0 ? `${countdown()} after resendable` : 'Send captcha'}
          </nord-button>
        </div>
        <nord-input
          label="Your received captcha"
          value={code()}
          onInput={({ target }) => {
            setCode(target.value);
          }}
        />
        <nord-button
          variant="primary"
          loading={submiting() || undefined}
          onClick={submitSend}>
          Submit
        </nord-button>
      </div>
    </nord-card>
  );
}

export default View;
