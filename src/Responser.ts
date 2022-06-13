import { CompleteHandler, ErrorHandler, SuccessHandler } from '../typings';

export default class Responser<R> {
  public timer = 0;   // 请求计数器，用于记录本hook请求的次数，主要用途是并行请求时判定请求的次数
  public successHandlers: SuccessHandler<R>[] = [];
  public errorHandlers: ErrorHandler[] = [];
  public completeHandlers: CompleteHandler[] = [];
  success(handler: SuccessHandler<R>) {
    this.successHandlers.push(handler);
    return this;
  }
  error(handler: ErrorHandler) {
    this.errorHandlers.push(handler);
    return this;
  }
  complete(handler: CompleteHandler) {
    this.completeHandlers.push(handler);
    return this;
  }
}


/**
 * 批量运行处理回调函数
 * @param handlers 处理函数数组
 * @param args 参数数组
 */
export const runHandlers = (handlers: Function[], ...args: any[]) => handlers.forEach(handler => handler.apply(null, args));

/**
 * 混合多个响应器，并在这些响应器都成功时调用成功回调，如果其中一个错误则调用失败回调
 * 与Promise.all类似
 * @param responsers 响应器数组
 * @returns 新的响应器
 */
export function all<T extends unknown[] | []>(responsers: T) {
  type DataCollection = { -readonly [P in keyof T]: T[P] extends Responser<infer R> ? R : never };
  const combinedResponser = new Responser<DataCollection>();
  const {
    successHandlers,
    errorHandlers,
    completeHandlers,
  } = combinedResponser;
  const responserLen = responsers.length;
  const requestCollections: Record<string, [any[], number]> = {};
  for (let i = 0; i < responserLen; i++) {
    (responsers as Responser<any>[])[i].success((data, requestId) => {
      const collectionItem = requestCollections[requestId] = requestCollections[requestId] || [[], 0];
      collectionItem[0][i] = data;
      collectionItem[1]++;
      if (collectionItem[1] >= responserLen) {
        runHandlers(successHandlers, collectionItem[0], requestId);
        runHandlers(completeHandlers, requestId);
      }
    }).error((error, requestId) => {
      runHandlers(errorHandlers, error, requestId);
      runHandlers(completeHandlers, requestId);
    });
  }

  // 当成功或失败回调被调用时，将会清空requestCollections，保证requestCollections没有多余的记录
  return combinedResponser.complete(requestId => {
    delete requestCollections[requestId];
  });
}