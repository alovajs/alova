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
    <span
      role="awaitResult"
      v-if="awaitResult"
      >{{ awaitResult }}</span
    >
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
      @click="refreshWithCatch(1)">
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
        // Insert data, the data will not be refreshed when inserting
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
        // Forward sequence replacement
        replace(400, 8)
      ">
      btn3
    </button>
    <button
      role="replace3"
      @click="
        // Reverse order replacement
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
        // Deleting the second item will fill the space with the data from the next page and re-fetch the data from the previous and next pages.
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
        // When the number of synchronization operations exceeds the page size, the removed data will be restored and the current page data will be requested again.
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
      @click="reloadWithCatch()">
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
    <button
      role="customSend"
      @click="send('a', 1)">
      btn1
    </button>
  </div>
</template>

<script setup lang="ts">
import { usePagination } from '@/index';
import { AlovaGenerics, Method } from 'alova';
import { ref } from 'vue';
import { PaginationHookConfig } from '~/typings/clienthook';
import { VueHookExportType } from '~/typings/stateshook/vue';

type CollapsedAlovaGenerics = Omit<AlovaGenerics, 'StatesExport'> & {
  StatesExport: VueHookExportType<unknown>;
};

const props = defineProps<{
  getter: (page: number, pageSize: number, ...args: any[]) => Method<CollapsedAlovaGenerics>;
  paginationConfig?: PaginationHookConfig<CollapsedAlovaGenerics, unknown[]>;
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
  send,
  update,
  insert,
  replace,
  remove,
  refresh
  // reload
} = exposure;

const awaitResult = ref<string | undefined>();
const refreshWithCatch = async (...args: any[]) => {
  awaitResult.value = undefined;
  return exposure
    .refresh(...args)
    .then(() => {
      awaitResult.value = 'resolve';
    })
    .catch(() => {
      awaitResult.value = 'reject';
    });
};
const reloadWithCatch = async () => {
  awaitResult.value = undefined;
  return exposure
    .reload()
    .then(() => {
      awaitResult.value = 'resolve';
    })
    .catch(() => {
      awaitResult.value = 'reject';
    });
};
</script>
