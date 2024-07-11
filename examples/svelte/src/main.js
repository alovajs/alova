import '@nordhealth/components';
import '@nordhealth/css';
import { bootSilentFactory } from 'alova/client';
import Layout from './Layout.svelte';
import { alova } from './api';
import './app.css';

export default new Layout({
  target: document.getElementById('app')
});

// need to boot silent factory before using useSQRequest
bootSilentFactory({
  alova,
  delay: 500,

  // set the request delay
  requestWait: [
    {
      queue: 'note',
      wait: silentMethod => silentMethod.entity.meta?.silentDelay
    }
  ]
});
