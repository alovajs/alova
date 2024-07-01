import { IsUnknown } from '@alova/shared/types';
import { AlovaGenerics, Method } from 'alova';
import {
  CompleteHandler,
  ErrorHandler,
  ExportedComputed,
  ExportedState,
  StateUpdater,
  SuccessHandler,
  UseHookExposure
} from '../general';
import { WatcherHookConfig } from './useWatcher';

/** @description usePagination相关 */
export type ArgGetter<R, LD> = (data: R) => LD | undefined;
export interface PaginationHookConfig<AG extends AlovaGenerics, ListData> extends WatcherHookConfig<AG> {
  /**
   * 是否预加载上一页
   * @default true
   */
  preloadPreviousPage?: boolean;
  /**
   * 是否预加载下一页
   * @default true
   */
  preloadNextPage?: boolean;
  /**
   * 指定数据总数量值
   * @default response => response.total
   */
  total?: ArgGetter<AG['Responded'], number>;
  /**
   * 指定分页的数组数据
   * @default response => response.data
   */
  data?: ArgGetter<AG['Responded'], ListData>;
  /**
   * 是否开启追加模式
   * @default false
   */
  append?: boolean;
  /**
   * 初始页码
   * @default 1
   */
  initialPage?: number;
  /**
   * 初始每页数据条数
   * @default 10
   */
  initialPageSize?: number;
  /**
   * 状态监听触发请求，使用 useWatcher 实现
   * @default [page, pageSize]
   */
  watchingStates?: AG['StatesExport']['Watched'][];
}

export interface UsePaginationExposure<AG extends AlovaGenerics, ListData extends unknown[]>
  extends Omit<UseHookExposure<AG>, 'update'> {
  page: ExportedState<number, AG['StatesExport']>;
  pageSize: ExportedState<number, AG['StatesExport']>;
  data: ExportedState<
    IsUnknown<
      ListData[number],
      AG['Responded'] extends {
        data: any;
      }
        ? AG['Responded']['data']
        : ListData,
      ListData
    >,
    AG['StatesExport']
  >;
  pageCount: ExportedComputed<number | undefined, AG['StatesExport']>;
  total: ExportedComputed<number | undefined, AG['StatesExport']>;
  isLastPage: ExportedComputed<boolean, AG['StatesExport']>;
  fetching: ExportedState<boolean, AG['StatesExport']>;
  onFetchSuccess(handler: SuccessHandler<AG>): UsePaginationExposure<AG, ListData>;
  onFetchError(handler: ErrorHandler<AG>): UsePaginationExposure<AG, ListData>;
  onFetchComplete(handler: CompleteHandler<AG>): UsePaginationExposure<AG, ListData>;
  update: StateUpdater<UsePaginationExposure<AG, ListData>>;

  /**
   * 刷新指定页码数据，此函数将忽略缓存强制发送请求
   * 如果未传入页码则会刷新当前页
   * 如果传入一个列表项，将会刷新此列表项所在页，只对append模式有效
   * @param pageOrItemPage 刷新的页码或列表项
   */
  refresh(pageOrItemPage?: number | ListData[number]): void;

  /**
   * 插入一条数据
   * 如果未传入index，将默认插入到最前面
   * 如果传入一个列表项，将插入到这个列表项的后面，如果列表项未在列表数据中将会抛出错误
   * @param item 插入项
   * @param position 插入位置（索引）或列表项
   */
  insert(item: ListData extends any[] ? ListData[number] : any, position?: number | ListData[number]): Promise<void>;

  /**
   * 移除一条数据
   * 如果传入的是列表项，将移除此列表项，如果列表项未在列表数据中将会抛出错误
   * @param position 移除的索引或列表项
   */
  remove(...positions: (number | ListData[number])[]): Promise<void>;

  /**
   * 替换一条数据
   * 如果position传入的是列表项，将替换此列表项，如果列表项未在列表数据中将会抛出错误
   * @param item 替换项
   * @param position 替换位置（索引）或列表项
   */
  replace(item: ListData extends any[] ? ListData[number] : any, position: number | ListData[number]): void;

  /**
   * 从第一页开始重新加载列表，并清空缓存
   */
  reload(): void;
}

/**
 * alova分页hook
 * 分页相关状态自动管理、前后一页预加载、自动维护数据的新增/编辑/移除
 *
 * @param handler method创建函数
 * @param config pagination hook配置
 * @returns {UsePaginationExposure}
 */
export declare function usePagination<AG extends AlovaGenerics, ListData extends unknown[]>(
  handler: (page: number, pageSize: number) => Method<AG>,
  config?: PaginationHookConfig<AG, ListData>
): UsePaginationExposure<AG, ListData>;
