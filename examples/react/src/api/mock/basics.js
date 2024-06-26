import { defineMock } from '@alova/mock';

export default defineMock({
  '/get-list': ['apple', 'banana', 'orange'],
  '[POST]/add-fruit': ({ data }) => ({
    added: data.item
  })
});
