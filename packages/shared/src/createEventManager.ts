import { isFn } from '@/function';
import { filterItem, forEach, len, pushItem } from '@/vars';

export interface EventManager<EventType extends string> {
  on(type: EventType, handler: (event: any) => void): () => void;
  emit(type: EventType, event: Event): void;
  setDecorator(
    type: EventType,
    decorator: (handler: Parameters<EventManager<EventType>['on']>[1], event: any, index: number, length: number) => void
  ): void;
  eventMap: EventMap<EventType>;
}
type EventMap<EventType extends string> = {
  [eventType in EventType]?: ((event: any) => void)[];
};
type DecoratorMap<EventType extends string> = {
  [eventType in EventType]?: Parameters<EventManager<EventType>['setDecorator']>[1];
};
const createEventManager = <EventType extends string>() => {
  const eventMap: EventMap<EventType> = {};
  const decoratorMap: DecoratorMap<EventType> = {};
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
  } as EventManager<EventType>;
};

export default createEventManager;
