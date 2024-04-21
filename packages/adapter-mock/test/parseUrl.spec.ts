import { parseUrl } from '@/helper';

describe('parseUrl', () => {
  test('parse full url', () => {
    let parsed = parseUrl('http://xx.com/aa/bb');
    expect(parsed).toStrictEqual({
      pathname: '/aa/bb',
      query: {},
      hash: ''
    });

    parsed = parseUrl('//xx.com/aa/bb#555');
    expect(parsed).toStrictEqual({
      pathname: '/aa/bb',
      query: {},
      hash: '#555'
    });

    parsed = parseUrl('//xx.com/aa/bb?a=1&b=2&c=#555');
    expect(parsed).toStrictEqual({
      pathname: '/aa/bb',
      query: {
        a: '1',
        b: '2',
        c: ''
      },
      hash: '#555'
    });
  });

  test('parse relative url', () => {
    let parsed = parseUrl('/aa/bb');
    expect(parsed).toStrictEqual({
      pathname: '/aa/bb',
      query: {},
      hash: ''
    });

    parsed = parseUrl('/aa/bb#555');
    expect(parsed).toStrictEqual({
      pathname: '/aa/bb',
      query: {},
      hash: '#555'
    });

    parsed = parseUrl('/aa/bb?a=1&b=2&c=#555');
    expect(parsed).toStrictEqual({
      pathname: '/aa/bb',
      query: {
        a: '1',
        b: '2',
        c: ''
      },
      hash: '#555'
    });
  });
});
