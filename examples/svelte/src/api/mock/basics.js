import { defineMock } from '@alova/mock';

export default defineMock({
  '/get-list': ({ query }) => {
    const suffix = query.suffix ? `-${query.suffix}` : '';
    return ['apple', 'banana', 'orange'].map(item => item + suffix);
  },
  '[POST]/add-fruit': ({ data }) => ({
    added: data.item
  }),
  '/query-random': () => Array.from({ length: 5 }).map(() => (Math.random() * 100).toFixed(0))
});
