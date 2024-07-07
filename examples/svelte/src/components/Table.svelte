<script>
  import { createEventDispatcher } from 'svelte';

  export let style = '';
  export let loading = false;
  export let columns = [];
  export let data = [];
  export let title = undefined;
  export let rowProps = () => ({});
  export let pagination = undefined;

  const dispatch = createEventDispatcher();
  const getPageList = (page, pageCount) => {
    const start = Math.max(page - 2, 1);
    const end = Math.min(start + 4, pageCount);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  function cssStringify(obj) {
    return Object.keys(obj)
      .map(k => `${k}: ${obj[k]}`)
      .join(';');
  }
  function bindProps(node, props) {
    function updateProps() {
      // 处理样式
      if (props.style) {
        Object.assign(node.style, props.style);
      }

      // 处理其他属性
      Object.entries(props).forEach(([key, value]) => {
        if (key !== 'style' && !key.startsWith('on:')) {
          node.setAttribute(key, value);
        }
      });

      // 处理事件
      Object.entries(props).forEach(([key, value]) => {
        if (key.startsWith('on')) {
          const eventName = key.slice(2).toLowerCase(); // 移除 'on' 前缀
          node.addEventListener(eventName, value);
        }
      });
    }

    updateProps();
    return {
      update(newGetProps) {
        props = newGetProps;
        updateProps();
      },
      destroy() {
        // 移除所有添加的事件监听器
        Object.entries(props).forEach(([key, value]) => {
          if (key.startsWith('on')) {
            const eventName = key.slice(2).toLowerCase();
            node.removeEventListener(eventName, value);
          }
        });
      }
    };
  }
</script>

<nord-card
  padding="none"
  class="relative">
  {#if loading}
    <div class="absolute top-0 left-0 right-0 bottom-0 bg-gray-600 bg-opacity-30 z-10 flex items-center justify-center">
      <nord-spinner></nord-spinner>
    </div>
  {/if}
  {#if title}
    <h3
      class="text-lg"
      slot="header">
      {title}
    </h3>
  {/if}
  <nord-table style={cssStringify(style)}>
    <table>
      <thead>
        <tr>
          {#each columns as { title }}
            <th>{title}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#if data.length > 0}
          {#each data as row, index (index)}
            <tr use:bindProps={rowProps(row)}>
              {#each columns as { dataIndex, render }}
                <td>
                  {#if typeof render === 'string'}
                    {#if render === 'slot1'}
                      <slot
                        name="slot1"
                        {row}
                        {index}></slot>
                    {:else if render === 'slot2'}
                      <slot
                        name="slot2"
                        {row}
                        {index}></slot>
                    {:else if render === 'slot3'}
                      <slot
                        name="slot3"
                        {row}
                        {index}></slot>
                    {:else if render === 'slot4'}
                      <slot
                        name="slot4"
                        {row}
                        {index}></slot>
                    {:else if render === 'slot5'}
                      <slot
                        name="slot5"
                        {row}
                        {index}></slot>
                    {/if}
                  {:else}
                    {row[dataIndex]}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        {:else}
          <tr>
            <td colspan={columns.length}>No Data</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </nord-table>

  {#if pagination}
    <nord-stack
      direction="horizontal"
      align-items="center"
      role="list"
      class="p-4">
      <nord-button
        disabled={pagination.page <= 1}
        role="listitem"
        on:click={() => pagination.onChange(pagination.page - 1, pagination.pageSize)}>
        <nord-icon
          name="arrow-left-small"
          label="Previous"></nord-icon>
      </nord-button>
      {#if pagination.page > 5}
        <p
          class="n-padding-i-m n-color-text-weaker"
          aria-hidden="true">
          …
        </p>
      {/if}
      {#each getPageList(pagination.page, pagination.pageCount) as pageNumber}
        <nord-button
          key={pageNumber}
          on:click={() => pagination.onChange(pageNumber, pagination.pageSize)}
          role="listitem"
          variant={pageNumber === pagination.page ? 'primary' : 'plain'}>
          {pageNumber}
        </nord-button>
      {/each}
      {#if pagination.pageCount - pagination.page > 5}
        <p
          class="n-padding-i-m n-color-text-weaker"
          aria-hidden="true">
          …
        </p>
      {/if}
      <nord-button
        disabled={pagination.page >= pagination.pageCount}
        role="listitem"
        on:click={() => pagination.onChange(pagination.page + 1, pagination.pageSize)}>
        <nord-icon
          name="arrow-right-small"
          label="Next"></nord-icon>
      </nord-button>
      {#if pagination.pageSizes}
        <nord-select
          hide-label
          value={pagination.pageSize}
          on:input={event => pagination.onChange(pagination.page, Number(event.target.value))}>
          {#each pagination.pageSizes as size}
            <option value={size}>
              {size} items/page
            </option>
          {/each}
        </nord-select>
      {/if}
      {#if pagination.total}
        <nord-button disabled>Total: {pagination.total}</nord-button>
      {/if}
    </nord-stack>
  {/if}
</nord-card>
