import { filterSilentMethods, useSQRequest } from 'alova/client';
import { useState } from 'react';
import { getSettings, updateSetting } from '../api/methods';
import QueueConsole from '../components/QueueConsole';

function View() {
  // The `bootSilentFactory` has been called in `main.js`
  const [networkMode, setNetworkMode] = useState(0);
  const {
    data: settingData,
    loading,
    update
  } = useSQRequest(getSettings, {
    behavior: () => (networkMode === 0 ? 'queue' : 'static'),
    initialData: {
      textContent: ''
    }
  }).onSuccess(() => {
    // fill the request data in waiting list to current data
    filterSilentMethods().then(smAry => {
      console.log(smAry, 'fff');
      smAry.forEach(smItem => {
        if (!smItem.reviewData) {
          return;
        }
        const { name, value } = smItem.reviewData;
        update({
          data: {
            ...settingData,
            [name]: value
          }
        });
      });
    });
  });

  const { send: submitData, loading: submittingLoading } = useSQRequest((name, value) => updateSetting(name, value), {
    behavior: () => (networkMode === 0 ? 'silent' : 'static'),
    retryError: /network error/,
    maxRetryTimes: 5,
    backoff: {
      delay: 2000,
      multiplier: 1.5,
      endQuiver: 0.5
    },
    immediate: false
  }).onSuccess(({ silentMethod, sendArgs: [name, value] }) => {
    settingData[name] = value;
    if (silentMethod) {
      silentMethod.reviewData = { name, value };
      silentMethod.save();
    }
  });
  const selectOptions = ['A', 'B', 'C', 'D'];

  return (
    <div className="responsive">
      <nord-card class="relative">
        {(loading || submittingLoading) && <nord-spinner class="absolute top-4 right-4" />}
        <div className="grid grid-rows-[repeat(4,fit-content(100px))] gap-y-6">
          <nord-toggle
            label="Switch 1"
            checked={settingData.checkbox1 || undefined}
            onInput={({ target }) => {
              setTimeout(() => {
                submitData('checkbox1', target.checked);
              });
            }}
          />
          <nord-toggle
            label="Switch 2"
            checked={settingData.checkbox2 || undefined}
            onInput={({ target }) => {
              setTimeout(() => {
                submitData('checkbox2', target.checked);
              });
            }}
          />
          <nord-select
            label="Select Item"
            value={settingData.selectedMenu1}
            onInput={({ target }) => submitData('selectedMenu1', target.value)}>
            {selectOptions.map(title => (
              <option
                key={title}
                value={title}>
                {title}
              </option>
            ))}
          </nord-select>
          <nord-input
            label="Text 1"
            value={settingData.textContent}
            onBlur={({ target }) => submitData('textContent', target.value)}
            placeholder="input some text"></nord-input>
        </div>
      </nord-card>
      <QueueConsole onModeChange={value => setNetworkMode(value)} />
    </div>
  );
}

export default View;
