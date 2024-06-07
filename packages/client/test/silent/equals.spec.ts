import createVirtualResponse from '@/hooks/silent/virtualResponse/createVirtualResponse';
import equals from '@/hooks/silent/virtualResponse/equals';

describe('equals', () => {
  test('primitive comparation', () => {
    expect(equals(1, 1)).toBeTruthy();
    expect(equals(1, '1')).toBeFalsy();
    expect(equals('a', 'a')).toBeTruthy();
    expect(equals({}, {})).toBeFalsy();
    const obj = {};
    expect(equals(obj, obj)).toBeTruthy();
  });

  test('vdata comparation', () => {
    const num1 = createVirtualResponse(1);
    const num2 = createVirtualResponse(1);
    expect(equals(num1, num1)).toBeTruthy();
    // eslint-disable-next-line
    expect(equals(num1, num1 + '')).toBeTruthy();
    expect(equals(num1, `${num1}`)).toBeFalsy(); // TODO: 将导致失败
    expect(equals(num1, 1)).toBeFalsy();
    expect(equals(num1, num2)).toBeFalsy();
  });
});
