import createVirtualResponse from '@/hooks/silent/virtualResponse/createVirtualResponse';
import isVData from '@/hooks/silent/virtualResponse/isVData';
import stringifyVData from '@/hooks/silent/virtualResponse/stringifyVData';

describe('isVData', () => {
  test('primitive value', () => {
    expect(isVData(1)).toBeFalsy();
    expect(isVData('str')).toBeFalsy();
    expect(isVData(true)).toBeFalsy();
  });
  test('primitive wrap value', () => {
    /* eslint-disable */
    const num = new Object(1);
    const str = new Object('abc');
    const bool = new Object(true);
    /* eslint-enable */
    expect(isVData(num)).toBeFalsy();
    expect(isVData(str)).toBeFalsy();
    expect(isVData(bool)).toBeFalsy();
  });
  test('primitive wrap virtual data value', () => {
    const num = createVirtualResponse(1);
    const undef = createVirtualResponse(undefined);
    expect(isVData(num)).toBeTruthy();
    expect(isVData(undef)).toBeTruthy();
    expect(stringifyVData(num)).toBeTruthy();
    expect(stringifyVData(undef)).toBeTruthy();
  });
});
