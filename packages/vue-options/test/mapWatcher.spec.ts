import { mapWatcher } from '../src';

describe('mapWatcher', () => {
  test('single watch with handler', () => {
    const fn1 = () => {};
    const fn2 = () => {};
    let watchers = mapWatcher({
      testRequest: {
        loading: fn1,
        data: fn2,
        error: 'methodName1',
        data2: [fn1, fn2, 'methodName2']
      }
    });
    expect(watchers).toStrictEqual({
      'alovaHook$.testRequest.loading': fn1,
      'alovaHook$.testRequest.data': fn2,
      'alovaHook$.testRequest.error': 'methodName1',
      'alovaHook$.testRequest.data2': [fn1, fn2, 'methodName2']
    });

    watchers = mapWatcher({
      'testRequest.loading': fn1,
      'testRequest.data': fn2
    });
    expect(watchers).toStrictEqual({
      'alovaHook$.testRequest.loading': fn1,
      'alovaHook$.testRequest.data': fn2
    });
  });

  test('single watch with detail object', () => {
    const obj1 = {
      handler() {},
      deep: true
    };
    const obj2 = {
      handler() {}
    };
    let watchers = mapWatcher({
      testRequest: {
        loading: obj1,
        data: obj2,
        error: [obj1, obj2]
      }
    });
    expect(watchers).toStrictEqual({
      'alovaHook$.testRequest.loading': obj1,
      'alovaHook$.testRequest.data': obj2,
      'alovaHook$.testRequest.error': [obj1, obj2]
    });

    watchers = mapWatcher({
      'testRequest.loading': obj1,
      'testRequest.data': obj2
    });
    expect(watchers).toStrictEqual({
      'alovaHook$.testRequest.loading': obj1,
      'alovaHook$.testRequest.data': obj2
    });
  });

  test('batch watch', () => {
    const fn1 = () => {};
    const fn2 = () => {};
    let watchers = mapWatcher({
      'testRequest, testRequest2': {
        loading: fn1,
        data: fn2,
        error: 'methodName1',
        data2: [fn1, fn2, 'methodName2']
      }
    });
    expect(watchers).toStrictEqual({
      'alovaHook$.testRequest.loading': fn1,
      'alovaHook$.testRequest.data': fn2,
      'alovaHook$.testRequest2.loading': fn1,
      'alovaHook$.testRequest2.data': fn2,
      'alovaHook$.testRequest.error': 'methodName1',
      'alovaHook$.testRequest2.error': 'methodName1',
      'alovaHook$.testRequest.data2': [fn1, fn2, 'methodName2'],
      'alovaHook$.testRequest2.data2': [fn1, fn2, 'methodName2']
    });

    watchers = mapWatcher({
      'testRequest.loading, testRequest.data': fn1
    });
    expect(watchers).toStrictEqual({
      'alovaHook$.testRequest.loading': fn1,
      'alovaHook$.testRequest.data': fn1
    });

    watchers = mapWatcher({
      'testRequest, testRequest2': {
        'loading, data': fn1
      }
    });
    expect(watchers).toStrictEqual({
      'alovaHook$.testRequest.loading': fn1,
      'alovaHook$.testRequest.data': fn1,
      'alovaHook$.testRequest2.loading': fn1,
      'alovaHook$.testRequest2.data': fn1
    });
  });

  test('batch watch with detail object', () => {
    const obj1 = {
      handler() {},
      deep: true
    };
    const obj2 = {
      handler() {}
    };
    let watchers = mapWatcher({
      'testRequest, testRequest2': {
        loading: obj1,
        data: obj2
      }
    });
    expect(watchers).toStrictEqual({
      'alovaHook$.testRequest.loading': obj1,
      'alovaHook$.testRequest.data': obj2,
      'alovaHook$.testRequest2.loading': obj1,
      'alovaHook$.testRequest2.data': obj2
    });

    watchers = mapWatcher({
      'testRequest.loading, testRequest.data': obj1
    });
    expect(watchers).toStrictEqual({
      'alovaHook$.testRequest.loading': obj1,
      'alovaHook$.testRequest.data': obj1
    });

    watchers = mapWatcher({
      'testRequest, testRequest2': {
        'loading, data': obj1
      }
    });
    expect(watchers).toStrictEqual({
      'alovaHook$.testRequest.loading': obj1,
      'alovaHook$.testRequest.data': obj1,
      'alovaHook$.testRequest2.loading': obj1,
      'alovaHook$.testRequest2.data': obj1
    });
  });

  test('build watching handlers without prefix', () => {
    const fn1 = () => {};
    const fn2 = () => {};
    const fn3 = () => {};
    const fn4 = () => {};
    const watchers = mapWatcher(
      {
        state1: fn1,
        state2: {
          a: fn2
        },
        'state3, state4': fn3,
        'state5, state6': {
          'a, b': fn4
        }
      },
      false
    );
    expect(watchers).toStrictEqual({
      state1: fn1,
      'state2.a': fn2,
      state3: fn3,
      state4: fn3,
      'state5.a': fn4,
      'state5.b': fn4,
      'state6.a': fn4,
      'state6.b': fn4
    });
  });
});
