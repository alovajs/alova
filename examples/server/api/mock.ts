import { defineMock } from '@alova/mock';

export default defineMock({
  '/fruits': ({ query }) => {
    const { errTimes, id } = query;
    retriedTimes[id] = retriedTimes[id] || 0;
    if (errTimes && errTimes > retriedTimes[id]) {
      retriedTimes[id]++;
      return {
        status: 500,
        statusText: `request error ${retriedTimes[id]} times`
      };
    }
    retriedTimes[id] = 0;
    return ['apple', 'banana', 'orange'];
  },
  '[POST]/captcha/send': 'SUCCESS'
});
const retriedTimes: Record<string, any> = {};
