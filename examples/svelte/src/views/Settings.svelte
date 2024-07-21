<script>
  import { filterSilentMethods, useSQRequest } from 'alova/client';
  import { getSettings, updateSetting } from '../api/methods';
  import QueueConsole from '../components/QueueConsole.svelte';

  const queue = 'settings';
  let networkMode = 0;
  let selectOptions = ['A', 'B', 'C', 'D'];

  const { data: settingData, loading } = useSQRequest(getSettings, {
    behavior: () => (networkMode === 0 ? 'queue' : 'static'),
    queue,
    initialData: {
      textContent: ''
    }
  }).onSuccess(() => {
    filterSilentMethods(undefined, queue).then(smAry => {
      smAry.forEach(smItem => {
        if (!smItem.reviewData) {
          return;
        }
        const { name, value } = smItem.reviewData;
        $settingData.name = value;
      });
    });
  });

  const { send: submitData, loading: submittingLoading } = useSQRequest((name, value) => updateSetting(name, value), {
    behavior: () => (networkMode === 0 ? 'silent' : 'static'),
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
    $settingData[name] = value;
    if (silentMethod) {
      silentMethod.reviewData = { name, value };
      silentMethod.save();
    }
  });

  function onToggleInput(name, event) {
    setTimeout(() => {
      submitData(name, event.target.checked);
    });
  }

  function onSelectInput(name, event) {
    submitData(name, event.target.value);
  }

  function onTextBlur(name, event) {
    submitData(name, event.target.value);
  }

  function setNetworkMode(event) {
    networkMode = event.detail;
  }
</script>

<div class="responsive">
  <nord-card class="relative">
    {#if $loading || $submittingLoading}
      <nord-spinner class="absolute top-4 right-4" />
    {/if}
    <div class="grid grid-rows-[repeat(4,fit-content(100px))] gap-y-6">
      <nord-toggle
        label="Switch 1"
        checked={$settingData.checkbox1 || undefined}
        on:input={e => onToggleInput('checkbox1', e)} />
      <nord-toggle
        label="Switch 2"
        checked={$settingData.checkbox2 || undefined}
        on:input={e => onToggleInput('checkbox2', e)} />
      <nord-select
        label="Select Item"
        value={$settingData.selectedMenu1 || ''}
        on:change={e => onSelectInput('selectedMenu1', e)}>
        {#each selectOptions as title (title)}
          <option value={title}>{title}</option>
        {/each}
      </nord-select>
      <nord-input
        label="Text 1"
        value={$settingData.textContent}
        on:input={({ target }) => ($settingData.textContent = target.value)}
        on:blur={e => onTextBlur('textContent', e)}
        placeholder="input some text" />
    </div>
  </nord-card>
  <QueueConsole
    on:modeChange={setNetworkMode}
    queueName={queue} />
</div>
