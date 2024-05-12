import { filterItem, forEach, pushItem } from '@/vars';

type EventMap<Type extends string, Event> = {
  [eventType in Type]?: ((event: Event) => void)[];
};
const createEventManager = <EventType extends string, Event>() => {
  const eventMap: EventMap<EventType, Event> = {};
  return {
    on(type: EventType, handler: (event: Event) => void) {
      const eventTypeItem = (eventMap[type] = eventMap[type] || []);
      pushItem(eventTypeItem, handler);
      // 返回解绑函数
      return () => {
        eventMap[type] = filterItem(eventTypeItem, item => item !== handler);
      };
    },
    emit(type: EventType, event: Event) {
      forEach(eventMap[type] || [], handler => handler(event));
    }
  };
};

export default createEventManager;
