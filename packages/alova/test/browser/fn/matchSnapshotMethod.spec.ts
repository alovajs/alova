import { getAlovaInstance } from '#/utils';
import { globalConfig } from '@/index';
import { saveMethodSnapshot } from '@/storage/methodSnapShots';

describe('matchSnapshotMethod', () => {
  test('should change snapshot limitation when set `methodSnapshots` in globalConfig', () => {
    globalConfig({
      methodSnapshots: 0
    });

    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1 },
      name: 'limitation-method-test'
    });
    const Get2 = alova.Get('/unit-test', {
      params: { a: 2 },
      name: 'limitation-method-test'
    });
    saveMethodSnapshot(alova.id, Get1);
    saveMethodSnapshot(alova.id, Get2);

    // 由于限制为了0个，不能匹配到
    let matchedMethods = alova.matchSnapshot('limitation-method-test');
    expect(matchedMethods).toHaveLength(0);

    globalConfig({
      methodSnapshots: 1
    });
    saveMethodSnapshot(alova.id, Get1);
    saveMethodSnapshot(alova.id, Get2);
    matchedMethods = alova.matchSnapshot('limitation-method-test');
    // 由于限制为了1个，只能匹配到1个
    expect(matchedMethods).toHaveLength(1);

    // 恢复限制
    globalConfig({
      methodSnapshots: 1000
    });
  });

  test('match with name string', () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1 },
      name: 'get-method'
    });
    const Get2 = alova.Get('/unit-test', {
      params: { a: 2 },
      name: 'get-method'
    });
    const Get3 = alova.Get('/unit-test', {
      params: { a: 3 },
      name: 'get-method2'
    });

    saveMethodSnapshot(alova.id, Get1);
    saveMethodSnapshot(alova.id, Get2);
    saveMethodSnapshot(alova.id, Get3);

    // 匹配到前两个
    let matchedMethods = alova.matchSnapshot('get-method');
    expect(matchedMethods).toHaveLength(2);
    expect(matchedMethods[0]).toBe(Get1);
    expect(matchedMethods[1]).toBe(Get2);

    // 匹配到两个，并筛选出最后一个
    matchedMethods = alova.matchSnapshot({
      name: 'get-method',
      filter: (_, index, methods) => index === methods.length - 1
    });
    expect(matchedMethods).toHaveLength(1);
    expect(matchedMethods[0]).toBe(Get2);

    // 匹配不到
    matchedMethods = alova.matchSnapshot('get-method555');
    expect(matchedMethods).toHaveLength(0);

    // 匹配到两个，但默认取第一个
    let matchedMethod = alova.matchSnapshot('get-method', false);
    expect(matchedMethod).toBe(Get1);

    // 匹配到两个，并筛选出最后一个
    matchedMethod = alova.matchSnapshot(
      {
        name: 'get-method',
        filter: (_, index, methods) => index === methods.length - 1
      },
      false
    );
    expect(matchedMethod).toBe(Get2);

    // 匹配不到
    matchedMethod = alova.matchSnapshot('get-method555', false);
    expect(matchedMethod).toBeUndefined();
    // 匹配不到，filter不会被调用
    const mockFn = jest.fn();
    matchedMethod = alova.matchSnapshot(
      {
        name: 'get-method555',
        filter: () => {
          mockFn();
          return true;
        }
      },
      false
    );
    expect(matchedMethod).toBeUndefined();
    expect(mockFn).not.toHaveBeenCalled();
  });

  test('match with name regexp', () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1 },
      name: 'get-method1'
    });
    const Get2 = alova.Get('/unit-test', {
      params: { a: 2 },
      name: 'get-method1'
    });
    const Get3 = alova.Get('/unit-test', {
      params: { a: 3 },
      name: 'get-method2'
    });

    saveMethodSnapshot(alova.id, Get1);
    saveMethodSnapshot(alova.id, Get2);
    saveMethodSnapshot(alova.id, Get3);

    // 匹配到当前alova的3个
    let matchedMethods = alova.matchSnapshot(/^get-method/);
    expect(matchedMethods).toHaveLength(3);

    // 匹配到两个，并筛选出最后一个
    matchedMethods = alova.matchSnapshot({
      name: /get-method1/,
      filter: (_, index, methods) => index === methods.length - 1
    });
    expect(matchedMethods).toHaveLength(1);
    expect(matchedMethods[0]).toBe(Get2);

    // 匹配不到
    matchedMethods = alova.matchSnapshot(/get-method555/);
    expect(matchedMethods).toHaveLength(0);

    // 匹配到三个，但默认取第一个
    let matchedMethod = alova.matchSnapshot(
      {
        name: /get-method/
      },
      false
    );
    expect(matchedMethod).toBe(Get1);

    // 匹配到两个，并筛选出最后一个
    matchedMethod = alova.matchSnapshot(
      {
        name: /get-method1/,
        filter: (_, index, methods) => index === methods.length - 1
      },
      false
    );
    expect(matchedMethod).toBe(Get2);

    // 匹配不到
    matchedMethod = alova.matchSnapshot(/get-method555/, false);
    expect(matchedMethod).toBeUndefined();
    // 匹配不到，filter不会被调用
    const mockFn = jest.fn();
    matchedMethod = alova.matchSnapshot(
      {
        name: /get-method555/,
        filter: () => {
          mockFn();
          return true;
        }
      },
      false
    );
    expect(matchedMethod).toBeUndefined();
    expect(mockFn).not.toHaveBeenCalled();
  });

  test("shouldn't match the snapshots of alova2 when call `matchSnapshots` of alova1", () => {});
});
