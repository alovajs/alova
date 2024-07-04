import { useCaptcha, useRequest } from 'alova/client';
import { useState } from 'react';
import { sendCaptcha, submitForm } from '../api/methods';

function View() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const { loading, countdown, send } = useCaptcha(sendCaptcha, {
    initialCountdown: 20
  }).onSuccess(({ data }) => {
    setCode(data.code);
  });

  const { loading: submiting, send: submitSend } = useRequest(() => submitForm({ phone, code }), {
    immediate: false
  }).onSuccess(({ data }) => {
    alert('Submited, request body is: ' + JSON.stringify(data));
  });

  return (
    <nord-card>
      <div className="grid gap-y-4">
        <div className="grid grid-cols-[repeat(2,fit-content(100px))] items-end gap-x-4">
          <nord-input
            label="Phone Number"
            value={phone}
            onInput={({ target }) => {
              setPhone(target.value);
            }}></nord-input>
          <nord-button
            variant="primary"
            onClick={() => send(phone)}
            disabled={(!loading && countdown > 0) || undefined}
            loading={loading || undefined}>
            {countdown > 0 ? `${countdown} after resendable` : 'Send captcha'}
          </nord-button>
        </div>
        <nord-input
          label="Your received captcha"
          value={code}
          onInput={({ target }) => {
            setCode(target.value);
          }}></nord-input>
        <nord-button
          variant="primary"
          loading={submiting || undefined}
          onClick={submitSend}>
          Submit
        </nord-button>
      </div>
    </nord-card>
  );
}

export default View;
