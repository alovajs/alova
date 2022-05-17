// import { RequestState } from '../../../typings';
// import Alova from '../../Alova';

// type EventName = 'silent';
// export function on<S extends RequestState, E extends RequestState>(alova: Alova<S, E>, eventName: EventName, handler: (alova: Alova, request: Request) => void) {
//   if (!alova.events[eventName]) {
//     alova.events[eventName] = [];
//   }
//   alova.events[eventName].push(handler);
// }

// 暂留，考虑后续实现