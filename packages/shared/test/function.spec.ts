import { createAssert } from '@/assert';
import {
  buildCompletedURL,
  createAsyncQueue,
  createSyncOnceRunner,
  getConfig,
  getContext,
  getContextOptions,
  getHandlerMethod,
  getLocalCacheConfigParam,
  getTime,
  instanceOf,
  isFn,
  isPlainObject,
  isSpecialRequestBody,
  isString,
  key,
  omit,
  uuid,
  walkObject
} from '@/function';
import { MEMORY, STORAGE_RESTORE } from '@/vars';
import { delay, untilCbCalled } from 'root/testUtils';

describe('shared functions', () => {
  test('judgement functions', () => {
    expect(isFn(() => {})).toBeTruthy();
    expect(isFn(null)).toBeFalsy();
    expect(isFn(123)).toBeFalsy();

    expect(isString('123')).toBeTruthy();
    expect(isString(123)).toBeFalsy();
    expect(isString(null)).toBeFalsy();

    const plainObject = {};
    expect(isPlainObject(plainObject)).toBeTruthy();
    const nonPlainObject = Object.create(null);
    expect(isPlainObject(nonPlainObject)).toBeTruthy();
    const nonObjectValues = [null, undefined, 123, 'string', true, Symbol('symbol')];
    nonObjectValues.forEach(value => {
      expect(isPlainObject(value)).toBeFalsy();
    });

    expect(instanceOf(plainObject, Object)).toBeTruthy();
    expect(instanceOf(nonPlainObject, Number)).toBeFalsy();
  });

  test('function getTime', () => {
    // Let's say it's some specific time, but for testing purposes we don't need to know exactly what it is
    // We just check if the value returned by getTime is a number and it changes over time (although this check may not be precise enough in unit tests)
    const now = Date.now();
    let result = getTime();

    // Since Date.now() returns the current time (milliseconds), and the test executes quickly
    // So we expect the return value of getTime to be very close to the current time (but not exactly the same, because time is constantly passing)
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(now - 5); // Allow 5 milliseconds error
    expect(result).toBeLessThanOrEqual(now + 5); // Allow 5 milliseconds error

    // Create a specific date object
    const specificDate = new Date('2023-06-30T12:00:00Z');
    const specificTime = specificDate.getTime();

    // Call getTime and pass in the date object we created
    result = getTime(specificDate);

    // Check if the returned time is the same as the date object we provided
    expect(result).toBe(specificTime);
  });

  test('function getContext', () => {
    // Simulate a Method instance
    const mockMethodInstance = {
      context: {}
    };

    // Call the getContext function
    const result = getContext(mockMethodInstance as any);
    expect(result).toBe(mockMethodInstance.context);
  });

  test('function getConfig', () => {
    const mockMethodInstance = {
      config: {}
    };

    // Call the getConfig function
    const result = getConfig(mockMethodInstance as any);

    // Verify if the returned config is what we expect
    expect(result).toBeDefined();
    expect(result).toBe(mockMethodInstance.config);
  });

  test('function getContextOptions', () => {
    // Call the getContextOptions function
    const mockAlovaInstance = {
      options: {}
    };
    const result = getContextOptions(mockAlovaInstance as any);

    // Verify if the returned options are what we expect
    expect(result).toBeDefined();
    expect(result).toStrictEqual(mockAlovaInstance.options);
  });
  test('function key', () => {
    // Simulate a Method instance
    const mockMethodInstance = {
      type: 'POST',
      url: '/unit-test',
      data: { foo: 'bar' },
      config: {
        params: {
          p1: 'p1',
          p2: 'p2'
        },
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' }
      }
    };

    // Call the key function
    const result = key(mockMethodInstance as any);

    // Verify if the returned key is what we expect
    const expectedKey = JSON.stringify([
      mockMethodInstance.type,
      mockMethodInstance.url,
      mockMethodInstance.config.params,
      mockMethodInstance.data,
      mockMethodInstance.config.headers
    ]);
    expect(result).toBe(expectedKey);
  });

  test('function isSpecialRequestBody', () => {
    expect(isSpecialRequestBody(new Blob())).toBeTruthy();
    expect(isSpecialRequestBody(new FormData())).toBeTruthy();
    // Note: ReadableStream is an abstract class and can't be instantiated directly in a test environment.
    // You might need to use a polyfill or a mock implementation for testing.
    // expect(isSpecialRequestBody(new ReadableStream())).toBeTruthy(); // Uncomment if you have a mock or polyfill
    expect(isSpecialRequestBody(new URLSearchParams())).toBeTruthy();
    expect(isSpecialRequestBody(new ArrayBuffer(100))).toBeTruthy();

    expect(isSpecialRequestBody({})).toBeFalsy();
    expect(isSpecialRequestBody([])).toBeFalsy();
    expect(isSpecialRequestBody(null)).toBeFalsy();
    expect(isSpecialRequestBody(undefined)).toBeFalsy();
    expect(isSpecialRequestBody('string')).toBeFalsy();
    expect(isSpecialRequestBody(123)).toBeFalsy();
  });

  test('function getHandlerMethod', () => {
    const mockMethodInstance = {
      key: 'mock-key'
    } as any;
    const mockAssert = createAssert('test');
    let result = getHandlerMethod(mockMethodInstance, mockAssert);
    expect(result).toBe(mockMethodInstance);

    const mockMethodHandler = () => mockMethodInstance;
    result = getHandlerMethod(mockMethodHandler, mockAssert);
    expect(result).toBe(mockMethodInstance);

    const mockWrongHandler = () => ({});
    expect(() => getHandlerMethod(mockWrongHandler as any, mockAssert)).toThrow(
      'hook handler must be a method instance or a function that returns method instance'
    );

    const nonFunctionNonMethod = {};
    expect(() => getHandlerMethod(nonFunctionNonMethod as any, mockAssert)).toThrowError(
      'hook handler must be a method instance or a function that returns method instance'
    );
  });

  test('function omit', () => {
    const obj1 = {
      a: 1,
      b: 2,
      c: 3,
      d: 4
    };
    const result1 = omit(obj1, 'b', 'd');
    expect(result1).toStrictEqual({
      a: 1,
      c: 3
    });
    // Ensure the original object is unchanged
    expect(obj1).toStrictEqual({
      a: 1,
      b: 2,
      c: 3,
      d: 4
    });

    const obj2 = {
      a: 1,
      b: 2
    };
    const result2 = omit(obj2);
    expect(result2).toStrictEqual(obj2);
    // Ensure the original object is unchanged
    expect(obj2).toStrictEqual({
      a: 1,
      b: 2
    });

    const obj3 = {
      a: 1,
      b: 2
    };
    const result3 = omit(obj3, 'a', 'b');
    expect(result3).toStrictEqual({});
    // Ensure the original object is unchanged
    expect(obj3).toStrictEqual({
      a: 1,
      b: 2
    });

    const obj4 = {
      a: 1,
      b: 2
    };
    const result4 = omit(obj4, 'c' as any, 'd');
    expect(result4).toStrictEqual({
      a: 1,
      b: 2
    });
    // Ensure the original object is unchanged
    expect(obj4).toStrictEqual({
      a: 1,
      b: 2
    });

    const obj5 = {
      a: 1,
      b: 2,
      c: {
        d: 3,
        e: 4
      }
    };
    const result5 = omit(obj5, 'b', 'c');
    expect(result5).toStrictEqual({
      a: 1
    });
    // Ensure the original object is unchanged
    expect(obj5).toStrictEqual({
      a: 1,
      b: 2,
      c: {
        d: 3,
        e: 4
      }
    });
  });

  test('function getLocalCacheConfigParam', () => {
    const mockAlovaInst = {
      Get(url: string, config: any = { cacheFor: 300000 }) {
        return {
          url,
          config
        } as any;
      }
    };

    const baseTs = 1600000000000;
    const nowFn = Date.now;
    Date.now = () => baseTs;
    // should return default cache parameters when cacheFor is undefined
    const mockMethodInstance = mockAlovaInst.Get('/unit-test');
    const result = getLocalCacheConfigParam(mockMethodInstance);
    // request GET has 5 min cache default.
    expect({ ...result, e: result.e('memory') }).toStrictEqual({
      c: false,
      e: baseTs + 300000,
      f: 300000,
      m: MEMORY,
      s: false,
      t: undefined
    });

    // should return cache parameters with custom expire time (number)
    const mockMethodInstance2 = mockAlovaInst.Get('/unit-test', {
      cacheFor: 60000
    });
    const result2 = getLocalCacheConfigParam(mockMethodInstance2);
    expect({ ...result2, e: result2.e('memory') }).toStrictEqual({
      c: false,
      e: baseTs + 60000,
      f: 60000,
      m: MEMORY,
      s: false,
      t: undefined
    });

    // 'should return cache parameters with custom expire time (Date)'
    const futureDate = new Date(baseTs + 50000); // 1 minute in the future
    const mockMethodInstance3 = mockAlovaInst.Get('/unit-test', {
      cacheFor: futureDate
    });
    const result3 = getLocalCacheConfigParam(mockMethodInstance3);
    expect({ ...result3, e: result3.e('memory') }).toStrictEqual({
      c: false,
      e: futureDate.getTime(),
      f: futureDate,
      m: MEMORY,
      s: false,
      t: undefined
    });

    // should return cache parameters with custom mode, expire time, and tag
    const mockMethodInstance4 = mockAlovaInst.Get('/unit-test', {
      cacheFor: {
        mode: STORAGE_RESTORE,
        expire: 30000, // 30 seconds
        tag: 'my-tag'
      }
    });
    const result4 = getLocalCacheConfigParam(mockMethodInstance4);
    expect({ ...result4, e: result4.e('restore'), e_m: result4.e('memory') }).toStrictEqual({
      c: false,
      e: 1600000030000,
      e_m: 1600000030000,
      f: {
        mode: STORAGE_RESTORE,
        expire: 30000, // 30 seconds
        tag: 'my-tag'
      },
      m: STORAGE_RESTORE,
      s: true,
      t: 'my-tag'
    });

    // parse controlled cache data
    const controlledCacheFor = () => ({
      data: 'controlled cache data'
    });
    const mockMethodInstance5 = mockAlovaInst.Get('/unit-test', {
      cacheFor: controlledCacheFor
    });
    const result5 = getLocalCacheConfigParam(mockMethodInstance5);
    expect({ ...result5, e: result5.e('memory') }).toStrictEqual({
      c: true,
      e: 0,
      f: controlledCacheFor,
      m: MEMORY,
      s: false,
      t: undefined
    });

    // should expire return different values when set expire to an function.
    const mockMethodInstance6 = mockAlovaInst.Get('/unit-test', {
      cacheFor: {
        mode: 'restore',
        expire: ({ mode }: any) => (mode === 'memory' ? 1000 : 5000)
      }
    });
    const result6 = getLocalCacheConfigParam(mockMethodInstance6);
    // request GET has 5 min cache default.
    expect({ ...result6, e: result6.e('restore'), e_m: result6.e('memory') }).toStrictEqual({
      c: false,
      e: 1600000005000,
      e_m: 1600000001000,
      f: mockMethodInstance6.config.cacheFor,
      m: STORAGE_RESTORE,
      s: true,
      t: undefined
    });

    Date.now = nowFn;
  });

  test('function createSyncOnceRunner', async () => {
    // 'should execute the function only once after multiple synchronous calls with delay'
    // Arrange
    const delay = 100; // Delay for demonstration purposes
    const runner = createSyncOnceRunner(delay);

    // This function will be executed by the runner
    const testFn = vi.fn();

    // Act
    // Call the runner multiple times synchronously
    runner(testFn);
    runner(testFn); // This call should not execute the function again
    runner(testFn); // Nor this one

    await untilCbCalled(setTimeout, delay + 3);
    expect(testFn).toHaveBeenCalledTimes(1);
  });

  test('function createAsyncQueue', async () => {
    // should execute async functions in order and resolve the promise
    const results: string[] = [];
    const { addQueue: addToQueue } = createAsyncQueue();

    const asyncFunction1 = (): Promise<string> =>
      new Promise(resolve => {
        setTimeout(() => {
          results.push('Result 1');
          resolve('Result 1');
        }, 100);
      });

    const asyncFunction2 = (): Promise<string> =>
      new Promise(resolve => {
        setTimeout(() => {
          results.push('Result 2');
          resolve('Result 2');
        }, 50);
      });

    const asyncFunction3 = (): Promise<string> =>
      new Promise(resolve => {
        setTimeout(() => {
          results.push('Result 3');
          resolve('Result 3');
        }, 150);
      });

    const result1 = await addToQueue(asyncFunction1);
    const result2 = await addToQueue(asyncFunction2);
    const result3 = await addToQueue(asyncFunction3);

    expect(results).toStrictEqual(['Result 1', 'Result 2', 'Result 3']);
    expect(result1).toBe('Result 1');
    expect(result2).toBe('Result 2');
    expect(result3).toBe('Result 3');

    // should handle an empty queue gracefully
    const { addQueue: addToQueue2 } = createAsyncQueue();

    // 添加空操作
    const results2 = await addToQueue2(async () => Promise.resolve('Empty'));

    // 不应该抛出任何错误
    expect(results2).toBe('Empty');

    // should reject the promise when async function fails and catchError is false
    const { addQueue: addToQueue3 } = createAsyncQueue();

    const asyncFunctionReject2 = (): Promise<string> =>
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Error'));
        }, 100);
      });

    let errorCaught = false;
    try {
      await addToQueue3(asyncFunctionReject2);
    } catch (error: any) {
      errorCaught = true;
      expect(error.message).toBe('Error');
    }

    expect(errorCaught).toBeTruthy();

    // should catch errors and resolve the promise when catchError is true
    const { addQueue: addToQueue4 } = createAsyncQueue(true);
    const results4: string[] = [];

    const asyncFunctionReject = (): Promise<void> =>
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Error'));
        }, 100);
      });

    const asyncFunction5 = (): Promise<string> =>
      new Promise(resolve => {
        setTimeout(() => {
          results4.push('Result 5');
          resolve('Result 5');
        }, 50);
      });

    const result5 = await addToQueue4(asyncFunctionReject);
    const result6 = await addToQueue4(asyncFunction5);

    expect(results4).toStrictEqual(['Result 5']);
    expect(result5).toBeUndefined();
    expect(result6).toBe('Result 5');
  });

  test('function walkObject', () => {
    // should perform a preorder traversal and call the callback
    // Arrange
    const target = {
      a: 1,
      b: {
        c: 2,
        d: 3
      },
      e: 4
    };

    const callbackSpy = vi.fn((value, _, __) => value);

    // Act
    walkObject(target, callbackSpy, true);

    // Assert
    expect(callbackSpy).toHaveBeenCalledTimes(5);
    expect(callbackSpy.mock.calls[0][0]).toBe(1);
    expect(callbackSpy.mock.calls[0][1]).toBe('a');
    expect(callbackSpy.mock.calls[0][2]).toBe(target);

    expect(callbackSpy.mock.calls[1][0]).toBe(target.b);
    expect(callbackSpy.mock.calls[1][1]).toBe('b');
    expect(callbackSpy.mock.calls[1][2]).toBe(target);

    expect(callbackSpy.mock.calls[2][0]).toBe(2);
    expect(callbackSpy.mock.calls[2][1]).toBe('c');
    expect(callbackSpy.mock.calls[2][2]).toBe(target.b);

    expect(callbackSpy.mock.calls[3][0]).toBe(3);
    expect(callbackSpy.mock.calls[3][1]).toBe('d');
    expect(callbackSpy.mock.calls[3][2]).toBe(target.b);

    expect(callbackSpy.mock.calls[4][0]).toBe(4);
    expect(callbackSpy.mock.calls[4][1]).toBe('e');
    expect(callbackSpy.mock.calls[4][2]).toBe(target);

    // should perform a postorder traversal and call the callback
    // Arrange
    const target2 = {
      a: 1,
      b: {
        c: 2,
        d: 3
      },
      e: 4
    };
    const callbackSpy2 = vi.fn((value, _, __) => value);

    // Act
    walkObject(target2, callbackSpy2, false);

    // Assert
    expect(callbackSpy2).toHaveBeenCalledTimes(5);
    expect(callbackSpy2.mock.calls[0][0]).toBe(1);
    expect(callbackSpy2.mock.calls[0][1]).toBe('a');
    expect(callbackSpy2.mock.calls[0][2]).toBe(target2);

    expect(callbackSpy2.mock.calls[1][0]).toBe(2);
    expect(callbackSpy2.mock.calls[1][1]).toBe('c');
    expect(callbackSpy2.mock.calls[1][2]).toBe(target2.b);

    expect(callbackSpy2.mock.calls[2][0]).toBe(3);
    expect(callbackSpy2.mock.calls[2][1]).toBe('d');
    expect(callbackSpy2.mock.calls[2][2]).toBe(target2.b);

    expect(callbackSpy2.mock.calls[3][0]).toBe(target2.b);
    expect(callbackSpy2.mock.calls[3][1]).toBe('b');
    expect(callbackSpy2.mock.calls[3][2]).toBe(target2);

    expect(callbackSpy2.mock.calls[4][0]).toBe(4);
    expect(callbackSpy2.mock.calls[4][1]).toBe('e');
    expect(callbackSpy2.mock.calls[4][2]).toBe(target2);

    // should handle when the callback changes the value
    // Arrange
    const target3 = {
      a: 1,
      b: {
        c: 2
      }
    };
    const callbackSpy3 = vi.fn((value, key, _) => {
      if (key === 'c') {
        return value * 2; // Double the value of 'c'
      }
      return value;
    });

    // Act
    walkObject(target3, callbackSpy3, true);

    // Assert
    expect(target3.b.c).toBe(4); // The value of 'c' should be doubled

    // Assert the callback was called with the correct values
    expect(callbackSpy3).toHaveBeenCalledTimes(3);
    expect(callbackSpy3.mock.calls[2][0]).toBe(2); // params is original value
    expect(callbackSpy3.mock.calls[2][1]).toBe('c'); // The new value for 'c'
    expect(callbackSpy3.mock.calls[2][2]).toBe(target3.b);
  });

  test('uuid', async () => {
    // generate 10000 uuids, 100 per times and interval 10 ms
    const total = 10000;
    const perTimes = 100;
    const uuidMap = {} as Record<string, any>;
    for (let i = 0; i < total / perTimes; i += 1) {
      for (let j = 0; j < perTimes; j += 1) {
        uuidMap[uuid()] = 1;
      }
      await delay(10);
    }
    expect(Object.keys(uuidMap)).toHaveLength(total);

    // generate 10000 uuids, 1000 per times and interval 50 ms
    const total2 = 10000;
    const perTimes2 = 1000;
    const uuidMap2 = {} as Record<string, any>;
    for (let i = 0; i < total2 / perTimes2; i += 1) {
      for (let j = 0; j < perTimes2; j += 1) {
        uuidMap2[uuid()] = 1;
      }
      await delay(50);
    }
    expect(Object.keys(uuidMap2)).toHaveLength(total2);
  });

  test('buildCompletedURL', () => {
    // should remove trailing slash from baseURL
    let result = buildCompletedURL('http://example.com/', 'api', {});
    expect(result).toBe('http://example.com/api');

    // should add leading slash to url if not present
    result = buildCompletedURL('http://example.com', 'api', {});
    expect(result).toBe('http://example.com/api');

    // should handle empty url
    result = buildCompletedURL('http://example.com', '', {});
    expect(result).toBe('http://example.com');

    // should append params as query string
    result = buildCompletedURL('http://example.com/api', '', { param1: 'value1', param2: 'value2' });
    expect(result).toBe('http://example.com/api?param1=value1&param2=value2');

    // should handle params with undefined values
    result = buildCompletedURL('http://example.com/api', '', { param1: 'value1', param2: undefined });
    expect(result).toBe('http://example.com/api?param1=value1');

    // 'should handle existing query string in url'
    result = buildCompletedURL('http://example.com/api?existingParam=existingValue', '', { param1: 'value1' });
    expect(result).toBe('http://example.com/api?existingParam=existingValue&param1=value1');
  });
});
