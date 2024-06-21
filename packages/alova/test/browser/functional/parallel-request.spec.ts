import { getAlovaInstance } from '#/utils';
import { Result } from 'root/testUtils';

describe('parallel request', () => {
  test('parallel request with `send` returned promise', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Getter = () =>
      alova.Get('/unit-test', {
        transform: ({ data }: Result) => data
      });
    const [firstResponse, secondResponse] = await Promise.all([Getter().send(), Getter().send()]);

    expect(firstResponse.path).toBe('/unit-test');
    expect(secondResponse.path).toBe('/unit-test');
  });

  test('[request fail]parallel request with `send` returned promise', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Getter = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    const ErrorGetter = alova.Get('/unit-test-404', {
      transform: ({ data }: Result) => data
    });
    await expect(Promise.all([Getter.send(), ErrorGetter.send()])).rejects.toThrow();
  });
});
