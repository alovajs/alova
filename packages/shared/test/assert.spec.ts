import { createAssert } from '@/assert';

describe('createAssert', () => {
  test('should throw an error when expression is false with prefix', () => {
    const assert = createAssert('validation');
    expect(() => assert(false, 'Value is not valid')).toThrowErrorMatchingSnapshot();
  });

  test('should not throw an error when expression is true with prefix', () => {
    const assert = createAssert('validation');
    expect(() => assert(true, 'Value is valid')).not.toThrow();
  });

  test('should throw an error with error code and include error details URL', () => {
    const assert = createAssert();
    const errCode = 1001;
    const msg = 'Invalid configuration';
    expect(() => assert(false, msg, errCode)).toThrowErrorMatchingSnapshot();
  });

  test('should throw an error without error code', () => {
    const assert = createAssert();
    const msg = 'Something went wrong';
    expect(() => assert(false, msg)).toThrowErrorMatchingSnapshot();
  });

  test('should handle null/undefined prefix gracefully', () => {
    const assertWithNull = createAssert(null as any);
    const assertWithUndefined = createAssert(undefined);
    expect(() => assertWithNull(false, 'Test with null prefix')).toThrowErrorMatchingSnapshot();
    expect(() => assertWithUndefined(false, 'Test with undefined prefix')).toThrowErrorMatchingSnapshot();
  });
});
