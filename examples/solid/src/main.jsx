import '@nordhealth/components';
import '@nordhealth/css';
import { bootSilentFactory } from 'alova/client';
import { render } from 'solid-js/web';
import { alova } from './api';
import './index.css';
import Layout from './Layout';

render(() => <Layout />, document.getElementById('app'));

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
