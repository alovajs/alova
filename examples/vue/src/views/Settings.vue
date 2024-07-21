<template>
  <div class="responsive">
    <nord-card class="relative">
      <nord-spinner
        v-if="loading || submittingLoading"
        class="absolute top-4 right-4" />
      <div class="grid grid-rows-[repeat(4,fit-content(100px))] gap-y-6">
        <nord-toggle
          label="Switch 1"
          :checked="settingData.checkbox1 || undefined"
          @input="onToggleInput('checkbox1', $event)" />
        <nord-toggle
          label="Switch 2"
          :checked="settingData.checkbox2 || undefined"
          @input="onToggleInput('checkbox2', $event)" />
        <nord-select
          label="Select Item"
          v-model="settingData.selectedMenu1"
          @input="onSelectInput('selectedMenu1', $event)">
          <option
            v-for="title in selectOptions"
            :key="title"
            :value="title">
            {{ title }}
          </option>
        </nord-select>
        <nord-input
          label="Text 1"
          v-model="settingData.textContent"
          @blur="onTextBlur('textContent', $event)"
          placeholder="input some text">
        </nord-input>
      </div>
    </nord-card>
    <QueueConsole
      @modeChange="setNetworkMode"
      :queueName="queue" />
  </div>
</template>

<script setup>
import { filterSilentMethods, useSQRequest } from 'alova/client';
import { ref } from 'vue';
import { getSettings, updateSetting } from '../api/methods';
import QueueConsole from '../components/QueueConsole.vue';

const queue = 'settings';
const networkMode = ref(0);
const selectOptions = ['A', 'B', 'C', 'D'];

const {
  data: settingData,
  loading,
  update
} = useSQRequest(getSettings, {
  behavior: () => (networkMode.value === 0 ? 'queue' : 'static'),
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
  behavior: () => (networkMode.value === 0 ? 'silent' : 'static'),
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
  settingData[name] = value;
  if (silentMethod) {
    silentMethod.reviewData = { name, value };
    silentMethod.save();
  }
});

const onToggleInput = (name, event) => {
  setTimeout(() => {
    submitData(name, event.target.checked);
  });
};

const onSelectInput = (name, event) => {
  submitData(name, event.target.value);
};

const onTextBlur = (name, event) => {
  submitData(name, event.target.value);
};

const setNetworkMode = value => {
  networkMode.value = value;
};
</script>
