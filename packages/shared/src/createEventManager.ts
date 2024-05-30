import { isFn } from './function';
import { PromiseCls, filterItem, len, mapItem, pushItem, undefinedValue } from './vars';

export interface EventManager<E extends object> {
  on<K extends keyof E>(type: K, handler: (event: E[K]) => void): () => void;
  off<K extends keyof E>(type: K, handler?: (event: E[K]) => void): () => void;
  /**
   * @param type
   * @param event
   * @param sync Whether to synchronize emit events, if set to `true`, this will wait for all listeners to return results using Promise.all
   */
  emit<K extends keyof E>(type: K, event: E[K], sync?: boolean): void;
  setDecorator<K extends keyof E>(
    type: K,
    decorator: (handler: (event: any) => void, event: any, index: number, length: number) => void
  ): void;
  eventMap: EventMap<E>;
}
type EventMap<E extends object> = {
  [K in keyof E]?: ((event: E[K]) => void)[];
};
type DecoratorMap<E extends object> = {
  [K in keyof E]?: (handler: (event: E[K]) => void, event: any, index: number, length: number) => void;
};
const createEventManager = <E extends object>() => {
  const eventMap: EventMap<E> = {};
  const decoratorMap: DecoratorMap<E> = {};
  return {
    eventMap,
    on(type, handler) {
      const eventTypeItem = (eventMap[type] = eventMap[type] || []);
      pushItem(eventTypeItem, handler);
      // return the off function
      return () => {
        eventMap[type] = filterItem(eventTypeItem, item => item !== handler);
      };
    },
    off(type, handler) {
      const handlers = eventMap[type];
      if (!handlers) {
        return;
      }
      if (handler) {
        const index = handlers.indexOf(handler);
        index > -1 && handlers.splice(index, 1);
      } else {
        delete eventMap[type];
      }
    },
    emit(type, event, sync = false) {
      const decorator = decoratorMap[type];
      const handlers = eventMap[type] || [];
      const executor: DecoratorMap<E>[any] = isFn(decorator) ? decorator : handler => handler(event);
      const res = mapItem(handlers, (handler, index) => executor(handler, event, index, len(handlers)));
      return sync ? PromiseCls.all(res) : undefinedValue;
    },
    setDecorator(type, decorator) {
      decoratorMap[type] = decorator;
    }
  } as EventManager<E>;
};

export default createEventManager;
