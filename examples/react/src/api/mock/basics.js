import { defineMock } from '@alova/mock';

export default defineMock({
  '/get-list': ['apple', 'banana', 'orange'],
  '[POST]/add-fruit': ({ data }) => ({
    added: data.item
  }),
  '/query-random': () => Array.from({ length: 5 }).map(() => (Math.random() * 100).toFixed(0))
});
