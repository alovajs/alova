<template>
  <div>
    <span role="status">{{ paging.loading ? 'loading' : 'loaded' }}</span>
    <span role="page">{{ paging.page }}</span>
    <span role="pageSize">{{ paging.pageSize }}</span>
    <span role="pageCount">{{ paging.pageCount }}</span>
    <span role="total">{{ paging.total }}</span>
    <span role="isLastPage">{{ paging.isLastPage }}</span>
    <span role="response">{{ JSON.stringify(paging.data) }}</span>
    <span role="error">{{ paging.error?.message }}</span>
    <button
      role="setPage"
      @click="paging$update({ page: paging.page + 1 })">
      btn1
    </button>
    <button
      role="setPageSize"
      @click="paging.pageSize = 20">
      btn2
    </button>
    <button
      role="setLastPage"
      @click="paging.page = paging.pageCount || 1">
      btn3
    </button>
  </div>
</template>

<script>
import { mapAlovaHook } from '@/index';
import { usePagination } from 'alova/client';

export default {
  props: {
    getter: {
      type: Function,
      required: true
    },
    paginationConfig: {
      type: Object
    }
  },
  mixins: mapAlovaHook(function () {
    return {
      paging: usePagination(this.getter, this.paginationConfig)
    };
  })
};
</script>
