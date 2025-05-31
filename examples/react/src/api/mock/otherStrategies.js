import { defineMock } from '@alova/mock';
import { formatDate } from '../../helper';

export default defineMock({
  '/configuration': () => {
    return {
      input: 'abc',
      select: 'Option 2',
      date: '2023-05-16',
      switch: true,
      checkbox: ['apple', 'grape']
    };
  },
  '[POST]/form': ({ data }) => data,
  '/cityArea': ({ query }) => {
    const tags = [
      { label: '海淀区', city: 'bj' },
      { label: '朝阳区', city: 'bj' },
      { label: '西城区', city: 'bj' },
      { label: '大兴区', city: 'bj' },
      { label: '东城区', city: 'bj' },
      { label: '顺义区', city: 'bj' },
      { label: '丰台区', city: 'bj' },
      { label: '昌平区', city: 'bj' },
      { label: '黄浦区', city: 'sh' },
      { label: '徐汇区', city: 'sh' },
      { label: '长宁区', city: 'sh' },
      { label: '静安区', city: 'sh' },
      { label: '普陀区', city: 'sh' },
      { label: '虹口区', city: 'sh' },
      { label: '浦东新区', city: 'sh' }
    ];
    return tags.filter(
      ({ label, city }) =>
        (query.search ? label.indexOf(query.search) >= 0 : true) && (query.city ? city === query.city : true)
    );
  },
  '/latestTime': () => formatDate(new Date()),
  '[POST]/captcha': () => ({
    code: Math.random().toString().slice(2, 6)
  }),
  '/retryData': ({ query }) => {
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
  '[POST]/upload': ({ data }) => {
    const key = data.keys().next();
    return {
      url: `https://example.com/file/${key.value}`
    };
  }
});
const retriedTimes = {};
