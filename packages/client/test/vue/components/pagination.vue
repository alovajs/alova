<template>
  <div>
    <span role="status">{{ loading ? 'loading' : 'loaded' }}</span>
    <span role="page">{{ page }}</span>
    <span role="pageSize">{{ pageSize }}</span>
    <span role="pageCount">{{ pageCount }}</span>
    <span role="total">{{ total }}</span>
    <span role="isLastPage">{{ JSON.stringify(isLastPage) }}</span>
    <span role="response">{{ JSON.stringify(data) }}</span>
    <span role="error">{{ error?.message }}</span>
    <span role="replacedError">{{ replacedError?.message }}</span>
    <button
      role="setPage"
      @click="update({ page: page + 1 })">
      btn1
    </button>
    <button
      role="setPage2"
      @click="update({ page: page + 2 })">
      btn1
    </button>
    <button
      role="subtractPage"
      @click="update({ page: page - 1 })">
      btn2
    </button>
    <button
      role="setPageSize"
      @click="update({ pageSize: 20 })">
      btn2
    </button>
    <button
      role="setLastPage"
      @click="update({ page: pageCount || 1 })">
      btn3
    </button>
    <button
      role="refresh1"
      @click="refresh(1)">
      btn3
    </button>
    <button
      role="refreshCurPage"
      @click="refresh()">
      btn3
    </button>
    <button
      role="refreshError"
      @click="runWithErrorHandling(() => refresh(100))">
      btn3
    </button>
    <button
      role="pageToLast"
      @click="update({ page: 31 })">
      btn1
    </button>
    <button
      role="insert300"
      @click="insert(300, 0)">
      btn3
    </button>
    <button
      role="batchInsert"
      @click="
        () => {
          insert(400);
          insert(500, 2);
          insert(600, pageSize - 1);
        }
      ">
      btn3
    </button>

    <button
      role="insert1"
      @click="
        // 插入数据，插入时不会刷新数据
        insert(100, 0)
      ">
      btn3
    </button>

    <button
      role="batchInsert1"
      @click="
        () => {
          insert(1000, 1);
          insert(1001, 2);
        }
      ">
      btn3
    </button>

    <button
      role="replaceError1"
      @click="runWithErrorHandling(() => replace(100, undefined as any))">
      btn3
    </button>
    <button
      role="replaceError2"
      @click="runWithErrorHandling(() => replace(100, 1000))">
      btn3
    </button>
    <button
      role="replace1"
      @click="replace(300, 0)">
      btn3
    </button>
    <button
      role="replace2"
      @click="
        // 正向顺序替换
        replace(400, 8)
      ">
      btn3
    </button>
    <button
      role="replace3"
      @click="
        // 逆向顺序替换
        replace(500, -4)
      ">
      btn3
    </button>
    <button
      role="replace4"
      @click="replace(200, 1)">
      btn3
    </button>

    <button
      role="replaceError1__search"
      @click="runWithErrorHandling(() => replace({ id: 100, word: 'zzz' }, { id: 2, word: 'ccc' }))">
      btn3
    </button>
    <button
      role="replaceByItem__search"
      @click="replace({ id: 100, word: 'zzz' }, data[2])">
      btn3
    </button>

    <button
      role="insertError1__search"
      @click="runWithErrorHandling(() => insert({ id: 100, word: 'zzz' }, { id: 2, word: 'ccc' }))">
      btn3
    </button>
    <button
      role="insertByItem__search"
      @click="insert({ id: 100, word: 'zzz' }, data[2])">
      btn3
    </button>

    <button
      role="batchRemove1"
      @click="
        // 删除第二项，将会用下一页的数据补位，并重新拉取上下一页的数据
        remove(1, 2)
      ">
      btn3
    </button>
    <button
      role="remove0"
      @click="remove(0)">
      btn3
    </button>
    <button
      role="remove1"
      @click="remove(1)">
      btn3
    </button>
    <button
      role="remove2"
      @click="remove(2)">
      btn3
    </button>
    <button
      role="batchRemove2"
      @click="
        // 同步操作的项数超过pageSize时，移除的数据将被恢复，并重新请求当前页数据
        remove(0, 1, 2, 3, 4)
      ">
      btn3
    </button>
    <button
      role="removeError1__search"
      @click="runWithErrorHandling(() => remove({ id: 2, word: 'ccc' }))">
      btn3
    </button>
    <button
      role="removeByItem__search"
      @click="remove(data[2])">
      btn3
    </button>

    <button
      role="toNoDataPage"
      @click="update({ page: 31 })">
      btn3
    </button>
    <button
      role="refreshByItem__search"
      @click="refresh(data[12])">
      btn3
    </button>
    <button
      role="mixedOperate"
      @click="
        () => {
          remove(1);
          remove(1);
          insert(100, 0);
          replace(200, 2);
        }
      ">
      btn3
    </button>
    <button
      role="reload1"
      @click="reload()">
      btn1
    </button>
    <button
      role="setLoading"
      @click="
        update({
          loading: true
        })
      ">
      btn1
    </button>
    <button
      role="clearData"
      @click="
        update({
          data: []
        })
      ">
      btn1
    </button>
  </div>
</template>

<script setup lang="ts">
import { usePagination } from '@/index';
import { AlovaGenerics, Method } from 'alova';
import { ComputedRef, Ref, WatchSource, ref } from 'vue';
import { PaginationHookConfig } from '~/typings/clienthook';

const props = defineProps<{
  getter: (
    page: number,
    pageSize: number
  ) => Method<
    AlovaGenerics<Ref<any>, ComputedRef<any>, object | WatchSource<any>, Ref<any>, any, any, any, any, any, any, any>
  >;
  paginationConfig?: PaginationHookConfig<any, unknown[]>;
  handleExposure?: (exposure: ReturnType<typeof usePagination>) => void;
}>();

const replacedError = ref(undefined as Error | undefined);

const runWithErrorHandling = <T extends (...args: any[]) => any>(fn: T) => {
  try {
    const res = fn();
    res?.catch((err: any) => {
      replacedError.value = err;
    });
  } catch (error: any) {
    replacedError.value = error;
  }
};

const exposure = usePagination(props.getter, props.paginationConfig);
props.handleExposure?.(exposure);
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
</script>
