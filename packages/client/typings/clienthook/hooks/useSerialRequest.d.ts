import { AlovaGenerics, Method } from 'alova';
import { AlovaMethodHandler, UseHookExposure } from '../general';
import { RequestHookConfig } from './useRequest';

/**
 * useSerialRequest
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export declare function useSerialRequest<AG extends AlovaGenerics, Args extends any[] = any[]>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG, Args>, ...AlovaMethodHandler<any>[]],
  config?: RequestHookConfig<AG>
): UseHookExposure<AG, Args>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export declare function useSerialRequest<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  Args extends any[] = any[]
>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG, Args>, AlovaMethodHandler<AG2>, ...AlovaMethodHandler<any>[]],
  config?: RequestHookConfig<AG>
): UseHookExposure<AG2, Args>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export declare function useSerialRequest<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  Args extends any[] = any[]
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG, Args>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    ...AlovaMethodHandler<any>[]
  ],
  config?: RequestHookConfig<AG>
): UseHookExposure<AG3, Args>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export declare function useSerialRequest<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics,
  Args extends any[] = any[]
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG, Args>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    ...AlovaMethodHandler<any>[]
  ],
  config?: RequestHookConfig<AG>
): UseHookExposure<AG4, Args>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export declare function useSerialRequest<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics,
  AG5 extends AlovaGenerics,
  Args extends any[] = any[]
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG, Args>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    AlovaMethodHandler<AG5>,
    ...AlovaMethodHandler<any>[]
  ],
  config?: RequestHookConfig<AG>
): UseHookExposure<AG5, Args>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export declare function useSerialRequest<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics,
  AG5 extends AlovaGenerics,
  AG6 extends AlovaGenerics,
  Args extends any[] = any[]
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG, Args>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    AlovaMethodHandler<AG5>,
    AlovaMethodHandler<AG6>,
    ...AlovaMethodHandler<any>[]
  ],
  config?: RequestHookConfig<AG>
): UseHookExposure<AG6, Args>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export declare function useSerialRequest<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics,
  AG5 extends AlovaGenerics,
  AG6 extends AlovaGenerics,
  AG7 extends AlovaGenerics,
  Args extends any[] = any[]
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG, Args>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    AlovaMethodHandler<AG5>,
    AlovaMethodHandler<AG6>,
    AlovaMethodHandler<AG7>,
    ...AlovaMethodHandler<any>[]
  ],
  config?: RequestHookConfig<AG>
): UseHookExposure<AG7, Args>;
