import { isFn } from './function';
import { filterItem, forEach, len, pushItem } from './vars';

export interface EventManager<E extends object> {
  on<K extends keyof E>(type: K, handler: (event: E[K]) => void): () => void;
  emit<K extends keyof E>(type: K, event: E[K]): void;
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
    emit(type, event) {
      const decorator = decoratorMap[type];
      const handlers = eventMap[type] || [];
      forEach(handlers, (handler, index) => (isFn(decorator) ? decorator(handler, event, index, len(handlers)) : handler(event)));
    },
    setDecorator(type, decorator) {
      decoratorMap[type] = decorator;
    }
  } as EventManager<E>;
};

export default createEventManager;
