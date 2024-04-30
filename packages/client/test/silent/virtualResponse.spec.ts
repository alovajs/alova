import createVirtualResponse from '../../src/hooks/silent/virtualResponse/createVirtualResponse';
import Null from '../../src/hooks/silent/virtualResponse/Null';
import Undefined from '../../src/hooks/silent/virtualResponse/Undefined';
import { symbolVDataId } from '../../src/hooks/silent/virtualResponse/variables';

// 虚拟响应测试
describe('virtual response', () => {
  test('undefined virtual data', () => {
    const undef = createVirtualResponse(undefined);
    expect(undef[symbolVDataId]).toMatch(/[a-z0-9]+/);
    expect(undef).toBeInstanceOf(Undefined);
  });

  test('null virtual data', () => {
    const nil = createVirtualResponse(null);
    expect(nil[symbolVDataId]).toMatch(/[a-z0-9]+/);
    expect(nil).toBeInstanceOf(Null);
  });

  test('create virtual response with primitive type', () => {
    // 基本类型包装对象拥有和基本类型一样的表现
    const vNumber = createVirtualResponse(1);
    expect(vNumber).toBeInstanceOf(Number);
    expect(vNumber.toFixed(1)).toBe('1.0');
    expect(vNumber.toPrecision(2)).toBe('1.0');
    expect(vNumber + 1).toMatch(/^\[vd:.+\]1$/);

    const vStr = createVirtualResponse('bb');
    expect(vStr.toString()).toBe('bb');
    expect(vStr.replace('bb', 'ccc')).toBe('ccc');
    expect(vStr + 111).toMatch(/^\[vd:.+\]111$/);

    const vBool = createVirtualResponse(true);
    expect(vBool.toString()).toBe('true');
    expect(vBool + 'aa').toMatch(/^\[vd:.+\]aa$/);
  });

  test('create virtual response with object', () => {
    const vObject = createVirtualResponse({
      a: 1,
      b: 'bb',
      c: [1, 2, 3]
    });
    const a = vObject.a;
    const b = vObject.b;
    const b1 = vObject.b.b1;
    const c = vObject.c;
    const c0 = vObject.c[0];
    expect(vObject[symbolVDataId]).not.toBeUndefined();
    expect(a).toBeInstanceOf(Number);
    expect(a[symbolVDataId]).not.toBeUndefined();
    expect(b).toBeInstanceOf(String);
    expect(b[symbolVDataId]).not.toBeUndefined();
    expect(b1).toBeUndefined();
    expect(c).toBeInstanceOf(Array);
    expect(c[symbolVDataId]).not.toBeUndefined();
    expect(c0).toBeInstanceOf(Number);
    expect(c0[symbolVDataId]).not.toBeUndefined();
  });

  test('create virtual response with array contained non plain object', () => {
    class A {
      aa = 1;
      bb = 'bb';
    }
    const vArray = createVirtualResponse([111, /123/, new Date(), new A()]);
    const [$1, $2, $3, $4] = vArray;
    expect(vArray).toBeInstanceOf(Array);
    expect(vArray[symbolVDataId]).not.toBeUndefined();
    expect($1).toBeInstanceOf(Number);
    expect($1[symbolVDataId]).not.toBeUndefined();
    expect($2).toBeInstanceOf(RegExp);
    expect($2[symbolVDataId]).not.toBeUndefined();
    expect($3).toBeInstanceOf(Date);
    expect($3[symbolVDataId]).not.toBeUndefined();
    expect($4).toBeInstanceOf(A);
    expect($4[symbolVDataId]).not.toBeUndefined();
    expect($4.aa).toBeInstanceOf(Number);
    expect($4.bb).toBeInstanceOf(String);
  });
});
