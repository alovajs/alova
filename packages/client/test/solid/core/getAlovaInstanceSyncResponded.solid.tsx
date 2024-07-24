import SolidHook from '@/statesHook/solid';
import { createAlova } from 'alova';
import GlobalFetch from 'alova/fetch';

export function getAlovaInstanceSyncResponded() {
  return createAlova({
    baseURL: 'http://localhost:3000',
    timeout: 3000,
    statesHook: SolidHook,
    requestAdapter: GlobalFetch(),
    responded: () => ({
      mock: 'mockdata'
    })
  });
}

export default getAlovaInstanceSyncResponded;
