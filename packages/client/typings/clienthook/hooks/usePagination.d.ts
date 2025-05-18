import type { IsUnknown } from '@alova/shared';
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

/**
 * @description usePagination related
 */
export type ArgGetter<R, LD> = (data: R) => LD | undefined;
export type PaginationActionStatus = '' | 'loading' | 'removing' | 'inserting' | 'replacing';

export interface PaginationActions<ListData extends unknown[]> {
  /**
   * Insert action method creator
   * @param item The item to insert
   * @param position Insert position (index) or list item
   */
  insert?: (
    item: ListData extends any[] ? ListData[number] : any,
    position?: number | ListData[number]
  ) => Promise<void>;
  /**
   * Remove action method creator
   * @param positions Removed index or list item
   */
  remove?: (item: number | ListData[number]) => Promise<void>;
  /**
   * Replace action method creator
   * @param item The item to replace
   * @param position Replace position (index) or list item
   */
  replace?: (
    item: ListData extends any[] ? ListData[number] : any,
    position: number | ListData[number]
  ) => Promise<void>;
}

export interface PaginationHookConfig<AG extends AlovaGenerics, ListData extends unknown[]>
  extends WatcherHookConfig<AG> {
  /**
   * Whether to preload the previous page
   * @default true
   */
  preloadPreviousPage?: boolean;
  /**
   * Whether to preload the next page
   * @default true
   */
  preloadNextPage?: boolean;
  /**
   * Specify the total amount of data
   * @default response => response.total
   */
  total?: ArgGetter<AG['Responded'], number>;
  /**
   * Specify paginated array data
   * @default response => response.data
   */
  data?: ArgGetter<AG['Responded'], ListData>;
  /**
   * Whether to enable append mode
   * @default false
   */
  append?: boolean;
  /**
   * Initial page number
   * @default 1
   */
  initialPage?: number;
  /**
   * Initial number of data items per page
   * @default 10
   */
  initialPageSize?: number;
  /**
   * State monitoring triggers requests, implemented using useWatcher
   * @default [page, pageSize]
   */
  watchingStates?: AG['StatesExport']['Watched'][];
  /**
   * Action methods for insert/remove/replace operations
   */
  actions?: PaginationActions<ListData>;
}
export interface UsePaginationExposure<AG extends AlovaGenerics, ListData extends unknown[], Args extends any[]>
  extends Omit<UseHookExposure<AG, Args, UsePaginationExposure<AG, ListData, Args>>, 'update'> {
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
  /**
   * Current action status
   */
  status: ExportedState<PaginationActionStatus, AG['StatesExport']>;
  /**
   * Index of the item being removed
   */
  removing: ExportedState<number | undefined, AG['StatesExport']>;
  /**
   * Index of the item being replaced
   */
  replacing: ExportedState<number | undefined, AG['StatesExport']>;
  onFetchSuccess(handler: SuccessHandler<AG, Args>): UsePaginationExposure<AG, ListData, Args>;
  onFetchError(handler: ErrorHandler<AG, Args>): UsePaginationExposure<AG, ListData, Args>;
  onFetchComplete(handler: CompleteHandler<AG, Args>): UsePaginationExposure<AG, ListData, Args>;
  update: StateUpdater<UsePaginationExposure<AG, ListData, Args>, AG['StatesExport']>;

  /**
   * Refresh the specified page number data. This function will ignore the cache and force the request to be sent.
   * If no page number is passed in, the current page will be refreshed.
   * If a list item is passed in, the page where the list item is located will be refreshed, which is only valid in append mode.
   * @param pageOrItemPage Refreshed page number or list item
   */
  refresh(pageOrItemPage?: number | ListData[number]): Promise<AG['Responded']>;

  /**
   * Insert a piece of data
   * If no index is passed in, it will be inserted at the front by default.
   * If a list item is passed in, it will be inserted after the list item. If the list item is not in the list data, an error will be thrown.
   * @param item insert
   * @param position Insert position (index) or list item
   */
  insert(item: ListData extends any[] ? ListData[number] : any, position?: number | ListData[number]): Promise<void>;

  /**
   * Remove a piece of data
   * If a list item is passed in, the list item will be removed. If the list item is not in the list data, an error will be thrown.
   * @param position Removed index or list item
   */
  remove(...positions: (number | ListData[number])[]): Promise<void>;

  /**
   * Replace a piece of data
   * If the position passed in is a list item, this list item will be replaced. If the list item is not in the list data, an error will be thrown.
   * @param item replacement
   * @param position Replace position (index) or list item
   */
  replace(item: ListData extends any[] ? ListData[number] : any, position: number | ListData[number]): void;

  /**
   * Reload the list starting from the first page and clear the cache
   */
  reload(): Promise<AG['Responded']>;
}

/**
 * anova paging hook
 * Automatic management of paging related status, preloading of previous and next pages, automatic maintenance of data addition/editing/removal
 *
 * @param handler methodCreate function
 * @param config pagination hook configuration
 * @returns {UsePaginationExposure}
 */
export declare function usePagination<AG extends AlovaGenerics, ListData extends unknown[], Args extends any[]>(
  handler: (page: number, pageSize: number, ...args: Args) => Method<AG>,
  config?: PaginationHookConfig<AG, ListData>
): UsePaginationExposure<AG, ListData, Args>;
