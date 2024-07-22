import { usePagination } from '@/index';
import { AlovaGenerics, Method } from 'alova';
import React, { useCallback, useEffect, useState } from 'react';
import { PaginationHookConfig } from '~/typings/clienthook';
import { ReactHookExportType } from '~/typings/stateshook/react';

type CollapsedAlovaGenerics = Omit<AlovaGenerics, 'StatesExport'> & {
  StatesExport: ReactHookExportType<unknown>;
};
interface Props {
  getter: (page: number, pageSize: number) => Method<CollapsedAlovaGenerics>;
  paginationConfig?: PaginationHookConfig<any, unknown[]> | (() => PaginationHookConfig<any, unknown[]>);
  handleExposure?: (exposure: ReturnType<typeof usePagination<CollapsedAlovaGenerics, any[]>>) => void;
}

function Pagination({ getter, paginationConfig = {}, handleExposure = () => {} }: Props) {
  const [replacedError, setReplacedError] = useState<Error | undefined>(undefined);
  const runWithErrorHandling = useCallback(<T extends (...args: any[]) => any>(fn: T) => {
    try {
      const res = fn();
      res?.catch((err: any) => {
        setReplacedError(err);
      });
    } catch (error: any) {
      setReplacedError(error);
    }
  }, []);

  const exposure = usePagination<CollapsedAlovaGenerics, any[]>(
    getter,
    typeof paginationConfig === 'function' ? paginationConfig() : paginationConfig
  );
  useEffect(() => {
    handleExposure?.(exposure);
  }, [exposure, handleExposure]);

  const {
    loading,
    data,
    pageCount,
    total,
    error,
    page,
    pageSize,
    isLastPage,
    update,
    refresh,
    insert,
    replace,
    remove,
    reload
  } = exposure;

  return (
    <div>
      <span role="status">{loading ? 'loading' : 'loaded'}</span>
      <span role="page">{page}</span>
      <span role="pageSize">{pageSize}</span>
      <span role="pageCount">{pageCount}</span>
      <span role="total">{total}</span>
      <span role="isLastPage">{JSON.stringify(isLastPage)}</span>
      <span role="response">{JSON.stringify(data)}</span>
      <span role="error">{error?.message}</span>
      <span role="replacedError">{replacedError?.message}</span>
      <button
        role="setPage"
        onClick={() => update({ page: page + 1 })}>
        btn
      </button>
      <button
        role="setPage2"
        onClick={() => update({ page: page + 2 })}>
        btn
      </button>
      <button
        role="subtractPage"
        onClick={() => update({ page: page - 1 })}>
        btn
      </button>
      <button
        role="setPageSize"
        onClick={() => update({ pageSize: 20 })}>
        btn
      </button>
      <button
        role="setLastPage"
        onClick={() => update({ page: pageCount || 1 })}>
        btn
      </button>
      <button
        role="refresh1"
        onClick={() => refresh(1)}>
        btn
      </button>
      <button
        role="refreshCurPage"
        onClick={() => refresh()}>
        btn
      </button>
      <button
        role="refreshError"
        onClick={() => runWithErrorHandling(() => refresh(100))}>
        btn
      </button>
      <button
        role="pageToLast"
        onClick={() => update({ page: 31 })}>
        btn
      </button>
      <button
        role="insert300"
        onClick={() => insert(300, 0)}>
        btn
      </button>
      <button
        role="batchInsert"
        onClick={() => {
          insert(400);
          insert(500, 2);
          insert(600, pageSize - 1);
        }}>
        btn
      </button>
      <button
        role="insert1"
        onClick={() => insert(100, 0)}>
        btn
      </button>
      <button
        role="batchInsert1"
        onClick={() => {
          insert(1000, 1);
          insert(1001, 2);
        }}>
        btn
      </button>
      <button
        role="replaceError1"
        onClick={() => runWithErrorHandling(() => replace(100, undefined as any))}>
        btn
      </button>
      <button
        role="replaceError2"
        onClick={() => runWithErrorHandling(() => replace(100, 1000))}>
        btn
      </button>
      <button
        role="replace1"
        onClick={() => replace(300, 0)}>
        btn
      </button>
      <button
        role="replace2"
        onClick={() => replace(400, 8)}>
        btn
      </button>
      <button
        role="replace3"
        onClick={() => replace(500, -4)}>
        btn
      </button>
      <button
        role="replace4"
        onClick={() => replace(200, 1)}>
        btn
      </button>
      <button
        role="replaceError1__search"
        onClick={() => runWithErrorHandling(() => replace({ id: 100, word: 'zzz' }, { id: 2, word: 'ccc' }))}>
        btn
      </button>
      <button
        role="replaceByItem__search"
        onClick={() => replace({ id: 100, word: 'zzz' }, data[2])}>
        btn
      </button>
      <button
        role="insertError1__search"
        onClick={() => runWithErrorHandling(() => insert({ id: 100, word: 'zzz' }, { id: 2, word: 'ccc' }))}>
        btn
      </button>
      <button
        role="insertByItem__search"
        onClick={() => insert({ id: 100, word: 'zzz' }, data[2])}>
        btn
      </button>
      <button
        role="batchRemove1"
        onClick={() => remove(1, 2)}>
        btn
      </button>
      <button
        role="remove0"
        onClick={() => remove(0)}>
        btn
      </button>
      <button
        role="remove1"
        onClick={() => remove(1)}>
        btn
      </button>
      <button
        role="remove2"
        onClick={() => remove(2)}>
        btn
      </button>
      <button
        role="batchRemove2"
        onClick={() => remove(0, 1, 2, 3, 4)}>
        btn
      </button>
      <button
        role="removeError1__search"
        onClick={() => runWithErrorHandling(() => remove({ id: 2, word: 'ccc' }))}>
        btn
      </button>
      <button
        role="removeByItem__search"
        onClick={() => remove(data[2])}>
        btn
      </button>
      <button
        role="toNoDataPage"
        onClick={() => update({ page: 31 })}>
        btn
      </button>
      <button
        role="refreshByItem__search"
        onClick={() => refresh(data[12])}>
        btn
      </button>
      <button
        role="mixedOperate"
        onClick={() => {
          remove(1);
          remove(1);
          insert(100, 0);
          replace(200, 2);
        }}>
        btn
      </button>
      <button
        role="reload1"
        onClick={reload}>
        btn
      </button>
      <button
        role="setLoading"
        onClick={() => update({ loading: true })}>
        btn
      </button>
      <button
        role="clearData"
        onClick={() => update({ data: [] })}>
        btn
      </button>
    </div>
  );
}

export default Pagination;
