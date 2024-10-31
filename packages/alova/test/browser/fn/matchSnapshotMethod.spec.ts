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

    // Since the limit is 0, it cannot be matched.
    expect(alova1.snapshots.match('limitation-method-test')).toHaveLength(0);
    expect(alova1.snapshots.match('limitation-method-test', false)).toBeUndefined();

    const alova2 = getAlovaInstance({
      responseExpect: r => r.json(),
      limitSnapshots: 1
    });
    alova2.snapshots.save(Get1);
    alova2.snapshots.save(Get2);
    // Since the limit is 1, only 1 can be matched.
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

    // Match the first two
    let matchedMethods = alova.snapshots.match('get-method');
    expect(matchedMethods).toHaveLength(2);
    expect(matchedMethods[0]).toBe(Get1);
    expect(matchedMethods[1]).toBe(Get2);

    // Matches two and filters out the last one
    matchedMethods = alova.snapshots.match({
      name: 'get-method',
      filter: (_, index, methods) => index === methods.length - 1
    });
    expect(matchedMethods).toHaveLength(1);
    expect(matchedMethods[0]).toBe(Get2);

    // No match found
    matchedMethods = alova.snapshots.match('get-method555');
    expect(matchedMethods).toHaveLength(0);

    // Two matches are matched, but the first one is taken by default.
    let matchedMethod = alova.snapshots.match('get-method', false);
    expect(matchedMethod).toBe(Get1);

    // Matches two and filters out the last one
    matchedMethod = alova.snapshots.match(
      {
        name: 'get-method',
        filter: (_, index, methods) => index === methods.length - 1
      },
      false
    );
    expect(matchedMethod).toBe(Get2);

    // No match found
    matchedMethod = alova.snapshots.match('get-method555', false);
    expect(matchedMethod).toBeUndefined();
    // If no match is found, the filter will not be called.
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

    // Match 3 of the current alova
    let matchedMethods = alova.snapshots.match(/^get-method/);
    expect(matchedMethods).toHaveLength(3);

    // Matches two and filters out the last one
    matchedMethods = alova.snapshots.match({
      name: /get-method1/,
      filter: (_, index, methods) => index === methods.length - 1
    });
    expect(matchedMethods).toHaveLength(1);
    expect(matchedMethods[0]).toBe(Get2);

    // No match found
    matchedMethods = alova.snapshots.match(/get-method555/);
    expect(matchedMethods).toHaveLength(0);

    // Three matches are matched, but the first one is taken by default.
    let matchedMethod = alova.snapshots.match(
      {
        name: /get-method/
      },
      false
    );
    expect(matchedMethod).toBe(Get1);

    // Matches two and filters out the last one
    matchedMethod = alova.snapshots.match(
      {
        name: /get-method1/,
        filter: (_, index, methods) => index === methods.length - 1
      },
      false
    );
    expect(matchedMethod).toBe(Get2);

    // No match found
    matchedMethod = alova.snapshots.match(/get-method555/, false);
    expect(matchedMethod).toBeUndefined();
    // If no match is found, the filter will not be called.
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
