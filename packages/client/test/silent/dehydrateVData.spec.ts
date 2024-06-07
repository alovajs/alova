import createVirtualResponse from '@/hooks/silent/virtualResponse/createVirtualResponse';
import dehydrateVData from '@/hooks/silent/virtualResponse/dehydrateVData';

describe('dehydrateVData', () => {
  test('primitive value', () => {
    expect(dehydrateVData(1)).toBe(1);
    expect(dehydrateVData('str')).toBe('str');
    expect(dehydrateVData(true)).toBe(true);
  });
  test('primitive wrap value', () => {
    /* eslint-disable */
    const num = new Object(1);
    const str = new Object('abc');
    const bool = new Object(true);
    /* eslint-enable */
    expect(dehydrateVData(num)).toBe(num);
    expect(dehydrateVData(str)).toBe(str);
    expect(dehydrateVData(bool)).toBe(bool);
  });
  test('primitive wrap virtual data value', () => {
    const num = createVirtualResponse(1);
    const str = createVirtualResponse('abc');
    const bool = createVirtualResponse(true);
    expect(dehydrateVData(num)).toBe(1);
    expect(dehydrateVData(str)).toBe('abc');
    expect(dehydrateVData(bool)).toBe(true);
  });
  test('undefined wrap value', () => {
    const undef = createVirtualResponse(undefined);
    expect(dehydrateVData(undef)).toBeUndefined();
  });
  test('null wrap value', () => {
    const nil = createVirtualResponse(null);
    expect(dehydrateVData(nil)).toBeNull();
  });
  test('reference value', () => {
    const ary = [1, 2, 3];
    const obj = { a: 1 };
    const date = new Date();
    expect(dehydrateVData(ary)).toBe(ary);
    expect(dehydrateVData(obj)).toBe(obj);
    expect(dehydrateVData(date)).toBe(date);
  });
  test('reference virtual data value', () => {
    const ary = [1, 2, 3];
    const obj = { a: 1 };
    const date = new Date();
    expect(dehydrateVData(createVirtualResponse(ary))).toBe(ary);
    expect(dehydrateVData(createVirtualResponse(obj))).toBe(obj);
    expect(dehydrateVData(createVirtualResponse(date))).toBe(date);
  });
});
