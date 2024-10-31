import { uuid } from './function';
import { filterItem, mapItem, pushItem } from './vars';

export interface EventManager<E extends object> {
  on<K extends keyof E>(type: K, handler: (event: E[K]) => void): () => void;
  off<K extends keyof E>(type: K, handler?: (event: E[K]) => void): () => void;
  /**
   * @param type
   * @param event
   * @param sync Whether to synchronize emit events, if set to `true`, this will wait for all listeners to return results using Promise.all
   */
  emit<K extends keyof E>(type: K, event: E[K]): any[];
  eventMap: EventMap<E>;
}
type EventMap<E extends object> = {
  [K in keyof E]?: ((event: E[K]) => void)[];
};
export const createEventManager = <E extends object>() => {
  const eventMap: EventMap<E> = {};
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
    emit(type, event) {
      const handlers = eventMap[type] || [];
      return mapItem(handlers, handler => handler(event));
    }
  } as EventManager<E>;
};

export const decorateEvent = <OnEvent extends (handler: (event: any) => void) => any>(
  onEvent: OnEvent,
  decoratedHandler: (handler: Parameters<OnEvent>[0], event: Parameters<Parameters<OnEvent>[0]>[0]) => void
) => {
  const emitter = createEventManager<{
    [x: string]: any;
  }>();
  const eventType = uuid();
  const eventReturn = onEvent(event => emitter.emit(eventType, event));
  return (handler: Parameters<OnEvent>[0]) => {
    emitter.on(eventType, event => {
      decoratedHandler(handler, event);
    });
    return eventReturn;
  };
};
