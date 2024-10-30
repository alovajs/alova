import { getAlovaInstance } from '#/utils';

describe('matchSnapshotMethod', () => {
  test('should change snapshot limitation when limit the number of snapshots', () => {
    const alova1 = getAlovaInstance({
      responseExpect: r => r.json(),
      limitSnapshots: 0
    });
    const Get1 = alova1.Get('/unit-test', {
      params: { a: 1 },
      name: 'limitation-method-test'
    });
    const Get2 = alova1.Get('/unit-test', {
      params: { a: 2 },
      name: 'limitation-method-test'
    });
    alova1.snapshots.save(Get1);
    alova1.snapshots.save(Get2);

    // 由于限制为了0个，不能匹配到
    expect(alova1.snapshots.match('limitation-method-test')).toHaveLength(0);
    expect(alova1.snapshots.match('limitation-method-test', false)).toBeUndefined();

    const alova2 = getAlovaInstance({
      responseExpect: r => r.json(),
      limitSnapshots: 1
    });
    alova2.snapshots.save(Get1);
    alova2.snapshots.save(Get2);
    // 由于限制为了1个，只能匹配到1个
    expect(alova2.snapshots.match('limitation-method-test')).toHaveLength(1);
    expect(alova2.snapshots.match('limitation-method-test', false)).toBe(Get1);
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

    alova.snapshots.save(Get1);
    alova.snapshots.save(Get2);
    alova.snapshots.save(Get3);

    // 匹配到前两个
    let matchedMethods = alova.snapshots.match('get-method');
    expect(matchedMethods).toHaveLength(2);
    expect(matchedMethods[0]).toBe(Get1);
    expect(matchedMethods[1]).toBe(Get2);

    // 匹配到两个，并筛选出最后一个
    matchedMethods = alova.snapshots.match({
      name: 'get-method',
      filter: (_, index, methods) => index === methods.length - 1
    });
    expect(matchedMethods).toHaveLength(1);
    expect(matchedMethods[0]).toBe(Get2);

    // 匹配不到
    matchedMethods = alova.snapshots.match('get-method555');
    expect(matchedMethods).toHaveLength(0);

    // 匹配到两个，但默认取第一个
    let matchedMethod = alova.snapshots.match('get-method', false);
    expect(matchedMethod).toBe(Get1);

    // 匹配到两个，并筛选出最后一个
    matchedMethod = alova.snapshots.match(
      {
        name: 'get-method',
        filter: (_, index, methods) => index === methods.length - 1
      },
      false
    );
    expect(matchedMethod).toBe(Get2);

    // 匹配不到
    matchedMethod = alova.snapshots.match('get-method555', false);
    expect(matchedMethod).toBeUndefined();
    // 匹配不到，filter不会被调用
    const mockFn = vi.fn();
    matchedMethod = alova.snapshots.match(
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

    alova.snapshots.save(Get1);
    alova.snapshots.save(Get2);
    alova.snapshots.save(Get3);

    // 匹配到当前alova的3个
    let matchedMethods = alova.snapshots.match(/^get-method/);
    expect(matchedMethods).toHaveLength(3);

    // 匹配到两个，并筛选出最后一个
    matchedMethods = alova.snapshots.match({
      name: /get-method1/,
      filter: (_, index, methods) => index === methods.length - 1
    });
    expect(matchedMethods).toHaveLength(1);
    expect(matchedMethods[0]).toBe(Get2);

    // 匹配不到
    matchedMethods = alova.snapshots.match(/get-method555/);
    expect(matchedMethods).toHaveLength(0);

    // 匹配到三个，但默认取第一个
    let matchedMethod = alova.snapshots.match(
      {
        name: /get-method/
      },
      false
    );
    expect(matchedMethod).toBe(Get1);

    // 匹配到两个，并筛选出最后一个
    matchedMethod = alova.snapshots.match(
      {
        name: /get-method1/,
        filter: (_, index, methods) => index === methods.length - 1
      },
      false
    );
    expect(matchedMethod).toBe(Get2);

    // 匹配不到
    matchedMethod = alova.snapshots.match(/get-method555/, false);
    expect(matchedMethod).toBeUndefined();
    // 匹配不到，filter不会被调用
    const mockFn = vi.fn();
    matchedMethod = alova.snapshots.match(
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
});
