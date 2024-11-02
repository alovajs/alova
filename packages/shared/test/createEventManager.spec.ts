import { createEventManager, decorateEvent } from '@/createEventManager';
import { untilCbCalled } from 'root/testUtils';

const getManager = () =>
  createEventManager<{
    foo: string;
    bar: number;
    baz: boolean;
    qux: any;
  }>();

describe('EventManager', () => {
  test('should export with correct types', () => {
    expect(typeof createEventManager).toBe('function');
    const manager = getManager();
    expect(typeof manager.emit).toBe('function');
    expect(typeof manager.on).toBe('function');
    expect(typeof manager.off).toBe('function');
    expect(manager.eventMap).toStrictEqual({});
  });

  test('should call listener correctly', () => {
    const manager = getManager();
    const mockFoo = vi.fn((data: string) => {
      expect(data).toStrictEqual('tom');
    });
    const mockBar = vi.fn((data: number) => {
      expect(data).toStrictEqual(9527);
    });
    const mockBaz = vi.fn((data: boolean) => {
      expect(data).toStrictEqual(true);
    });

    manager.on('foo', mockFoo);
    manager.on('bar', mockBar);
    manager.on('baz', mockBaz);

    manager.emit('foo', 'tom');
    manager.emit('bar', 9527);
    manager.emit('qux', 'any');

    expect(mockFoo).toHaveBeenCalledTimes(1);
    expect(mockBar).toHaveBeenCalledTimes(1);
    expect(mockBaz).not.toHaveBeenCalled();
  });

  test('should add to eventMap', () => {
    const manager = getManager();
    const mockFoo = vi.fn((data: string) => {
      expect(data).toStrictEqual('tom');
    });
    const mockBar = vi.fn((data: number) => {
      expect(data).toStrictEqual(9527);
    });
    const mockBaz = vi.fn((data: boolean) => {
      expect(data).toStrictEqual(true);
    });

    manager.on('foo', mockFoo);
    manager.on('bar', mockBar);
    manager.on('baz', mockBaz);

    expect(manager.eventMap).toStrictEqual({
      foo: [mockFoo],
      bar: [mockBar],
      baz: [mockBaz]
    });
  });

  test('should remove listener', () => {
    const manager = getManager();
    const mockFoo = vi.fn((data: string) => {
      expect(data).toStrictEqual('tom');
    });

    manager.on('foo', mockFoo);
    manager.emit('foo', 'tom');
    expect(mockFoo).toHaveBeenCalledTimes(1);

    manager.off('foo', mockFoo);
    manager.emit('foo', 'tom');
    expect(mockFoo).toHaveBeenCalledTimes(1);
  });

  test('should emit synchronously', async () => {
    const manager = getManager();
    const mockFoo1 = vi.fn(async (data: string) => {
      expect(data).toStrictEqual('tom');
      await untilCbCalled(setTimeout, 100);
      return 'foo1';
    });
    const mockFoo2 = vi.fn(async (data: string) => {
      expect(data).toStrictEqual('tom');
      await untilCbCalled(setTimeout, 200);
      return 'foo2';
    });
    const mockFoo3 = vi.fn(async (data: string) => {
      expect(data).toStrictEqual('tom');
      await untilCbCalled(setTimeout, 300);
      return 'foo3';
    });
    const mockFoo4 = vi.fn(async (data: string) => {
      expect(data).toStrictEqual('tom');
      await untilCbCalled(setTimeout, 400);
      return 'foo4';
    });

    manager.on('foo', mockFoo1);
    manager.on('foo', mockFoo2);
    manager.on('foo', mockFoo3);
    manager.on('foo', mockFoo4);

    const start = Date.now();
    const result = await Promise.all(manager.emit('foo', 'tom'));
    const usedTime = Date.now() - start;

    expect(usedTime).toBeGreaterThanOrEqual(400);
    expect(usedTime).toBeLessThanOrEqual(420);

    expect(mockFoo1).toHaveBeenCalledTimes(1);
    expect(mockFoo2).toHaveBeenCalledTimes(1);
    expect(mockFoo3).toHaveBeenCalledTimes(1);
    expect(mockFoo4).toHaveBeenCalledTimes(1);

    expect(result).toStrictEqual(['foo1', 'foo2', 'foo3', 'foo4']);
  });

  test('should decorate event handler with `decorateEvent`', async () => {
    const handlers: ((event: any) => void)[] = [];
    const handlerResFn = vi.fn();
    let onEvent = (handler: (event: any) => void) => {
      handlers.push(handler);
    };
    onEvent = decorateEvent(onEvent, (handler, event) => {
      event.decorated = true;
      const ret = handler(event);
      handlerResFn(ret);
    });

    onEvent(event => {
      expect(event.decorated).toBeTruthy();
      return 1;
    });
    onEvent(event => {
      expect(event.decorated).toBeTruthy();
      return 2;
    });

    // emit event
    handlers.forEach(handler => handler({}));
    expect(handlerResFn).toHaveBeenCalledTimes(2);
    expect(handlerResFn).toHaveBeenNthCalledWith(1, 1);
    expect(handlerResFn).toHaveBeenNthCalledWith(2, 2);
  });
});
