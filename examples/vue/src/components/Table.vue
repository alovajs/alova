<template>
  <nord-card
    padding="none"
    class="relative">
    <div
      v-if="loading"
      class="absolute top-0 left-0 right-0 bottom-0 bg-gray-600 bg-opacity-30 z-10 flex items-center justify-center">
      <nord-spinner></nord-spinner>
    </div>
    <h3
      v-if="title"
      class="text-lg"
      slot="header">
      {{ title }}
    </h3>
    <nord-table :style="style">
      <table>
        <thead>
          <tr>
            <th
              v-for="{ title, dataIndex } in columns"
              :key="dataIndex">
              {{ title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="data.length > 0">
            <tr
              v-for="(row, index) in data"
              :key="index"
              v-bind="rowProps ? rowProps(row, index) : {}">
              <td
                v-for="{ dataIndex, render } in columns"
                :key="dataIndex">
                <template v-if="typeof render === 'function'">
                  {{ render(row[dataIndex], row) }}
                </template>
                <template v-else>
                  {{ row[dataIndex] }}
                </template>
              </td>
            </tr>
          </template>
          <tr v-else>
            <td :colspan="columns.length">No Data</td>
          </tr>
        </tbody>
      </table>
    </nord-table>

    <nord-stack
      v-if="pagination"
      direction="horizontal"
      align-items="center"
      role="list"
      class="p-4">
      <nord-button
        v-if="pagination.page > 1"
        role="listitem"
        @click="pagination.onChange(pagination.page - 1, pagination.pageSize)">
        <nord-icon
          name="arrow-left-small"
          label="Previous"></nord-icon>
      </nord-button>
      <p
        v-if="pagination.page > 5"
        class="n-padding-i-m n-color-text-weaker"
        aria-hidden="true">
        …
      </p>

      <nord-button
        v-for="pageNumber in getPageList(pagination.page, pagination.pageCount)"
        :key="pageNumber"
        @click="pagination.onChange(pageNumber, pagination.pageSize)"
        role="listitem"
        :variant="pageNumber === pagination.page ? 'primary' : 'plain'">
        {{ pageNumber }}
      </nord-button>

      <p
        v-if="pagination.pageCount - pagination.page > 5"
        class="n-padding-i-m n-color-text-weaker"
        aria-hidden="true">
        …
      </p>
      <nord-button
        v-if="pagination.page < pagination.pageCount"
        role="listitem"
        @click="pagination.onChange(pagination.page + 1, pagination.pageSize)">
        <nord-icon
          name="arrow-right-small"
          label="Next"></nord-icon>
      </nord-button>

      <nord-select
        v-if="pagination.pageSizes"
        hide-label
        :value="pagination.pageSize"
        @input="event => pagination.onChange(pagination.page, event.target.value)">
        <option
          v-for="size in pagination.pageSizes"
          :key="size"
          :value="size">
          {{ size }} items/page
        </option>
      </nord-select>
      <nord-button
        v-if="pagination.total"
        disabled
        >Total: {{ pagination.total }}</nord-button
      >
    </nord-stack>
  </nord-card>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  style: Object,
  loading: Boolean,
  columns: {
    type: Array,
    required: true,
    validator: value => value.every(col => 'title' in col && 'dataIndex' in col)
  },
  data: {
    type: Array,
    required: true
  },
  title: String,
  rowProps: Function,
  pagination: Object
});

const getPageList = (page, pageCount) => {
  const start = Math.max(page - 2, 1);
  const end = Math.min(start + 4, pageCount);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};
</script>
