import { filterSilentMethods, useSQRequest } from 'alova/client';
import { For, createSignal } from 'solid-js';
import { getSettings, updateSetting } from '../api/methods';
import QueueConsole from '../components/QueueConsole';

const queue = 'settings';
function View() {
  // The `bootSilentFactory` has been called in `main.js`
  const [networkMode, setNetworkMode] = createSignal(0);
  const {
    data: settingData,
    loading,
    update
  } = useSQRequest(getSettings, {
    behavior: () => (networkMode() === 0 ? 'queue' : 'static'),
    queue,
    initialData: {
      textContent: ''
    }
  }).onSuccess(() => {
    // Fill the request data in waiting list to current data
    filterSilentMethods(undefined, queue).then(smAry => {
      smAry.forEach(smItem => {
        if (!smItem.reviewData) {
          return;
        }
        const { name, value } = smItem.reviewData;
        update({
          data: {
            ...settingData(),
            [name]: value
          }
        });
      });
    });
  });

  const { send: submitData, loading: submittingLoading } = useSQRequest((name, value) => updateSetting(name, value), {
    behavior: () => (networkMode() === 0 ? 'silent' : 'static'),
    queue,
    retryError: /network error/,
    maxRetryTimes: 5,
    backoff: {
      delay: 2000,
      multiplier: 1.5,
      endQuiver: 0.5
    },
    immediate: false
  }).onSuccess(({ silentMethod, args: [name, value] }) => {
    settingData()[name] = value;
    if (silentMethod) {
      silentMethod.reviewData = { name, value };
      silentMethod.save();
    }
  });

  const selectOptions = ['A', 'B', 'C', 'D'];

  return (
    <div class="responsive">
      <nord-card class="relative">
        {(loading() || submittingLoading()) && <nord-spinner class="absolute top-4 right-4" />}
        <div class="grid grid-rows-[repeat(4,fit-content(100px))] gap-y-6">
          <nord-toggle
            label="Switch 1"
            checked={settingData().checkbox1 || undefined}
            onInput={e => {
              setTimeout(() => {
                submitData('checkbox1', e.target.checked);
              });
            }}
          />
          <nord-toggle
            label="Switch 2"
            checked={settingData().checkbox2 || undefined}
            onInput={e => {
              setTimeout(() => {
                submitData('checkbox2', e.target.checked);
              });
            }}
          />
          <nord-select
            label="Select Item"
            value={settingData().selectedMenu1 || ''}
            onInput={e => submitData('selectedMenu1', e.target.value)}>
            <For each={selectOptions}>{title => <option value={title}>{title}</option>}</For>
          </nord-select>
          <nord-input
            label="Text 1"
            value={settingData().textContent}
            onBlur={e => submitData('textContent', e.target.value)}
            placeholder="input some text"
          />
        </div>
      </nord-card>
      <QueueConsole
        onModeChange={setNetworkMode}
        queueName={queue}
      />
    </div>
  );
}

export default View;
