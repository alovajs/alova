import '@nordhealth/components';
import '@nordhealth/css';
import { bootSilentFactory } from 'alova/client';
import { createApp } from 'vue';
import App from './App.vue';
import { alova } from './api';
import './style.css';

createApp(App).mount('#app');

// need to boot silent factory before using useSQRequest
bootSilentFactory({
  alova: alova,
  delay: 500,

  // set the request delay
  requestWait: [
    {
      queue: 'note',
      wait: silentMethod => silentMethod.entity.meta?.silentDelay
    }
  ]
});
