import { defineMock } from '@alova/mock';

export default defineMock({
  '/retryData': ({ query }) => {
    const { errTimes, id } = query;
    retriedTimes[id] = retriedTimes[id] || 0;
    console.log(errTimes, id, retriedTimes[id], errTimes > retriedTimes[id]);
    if (errTimes && errTimes > retriedTimes[id]) {
      retriedTimes[id]++;
      return {
        status: 500,
        statusText: `request error ${retriedTimes[id]} times`
      };
    }
    retriedTimes[id] = 0;
    return ['apple', 'banana', 'orange'];
  }
});
const retriedTimes: Record<string, any> = {};
