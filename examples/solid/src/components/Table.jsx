import { createMemo, For, mergeProps, Show } from 'solid-js';

function Table(_props) {
  const props = mergeProps({ style: {} }, _props);

  const pageList = createMemo(() => {
    const { page, pageCount } = props.pagination || {};
    if (!page || !pageCount) {
      return [];
    }

    const start = Math.max(page() - 2, 1);
    const end = Math.min(start + 4, pageCount());
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  return (
    <nord-card
      padding="none"
      class="relative">
      <Show when={props.loading}>
        <div class="absolute top-0 left-0 right-0 bottom-0 bg-gray-600 bg-opacity-30 z-10 flex items-center justify-center">
          <nord-spinner />
        </div>
      </Show>
      <Show when={props.title}>
        <h3
          class="text-lg"
          slot="header">
          {props.title}
        </h3>
      </Show>
      <nord-table style={props.style}>
        <table>
          <thead>
            <tr>
              <For each={props.columns}>{({ title }) => <th>{title}</th>}</For>
            </tr>
          </thead>
          <tbody>
            <Show
              when={props.data.length > 0}
              fallback={
                <tr>
                  <td colSpan={props.columns.length}>No Data</td>
                </tr>
              }>
              <For each={props.data}>
                {(row, index) => {
                  const componentProps = props.rowProps ? props.rowProps(row, index()) : {};
                  return (
                    <tr {...componentProps}>
                      <For each={props.columns}>
                        {({ dataIndex, render }) => (
                          <td>
                            {typeof render === 'function' ? render(row[dataIndex], row, index()) : row[dataIndex]}
                          </td>
                        )}
                      </For>
                    </tr>
                  );
                }}
              </For>
            </Show>
          </tbody>
        </table>
      </nord-table>
      <Show when={props.pagination}>
        <nord-stack
          direction="horizontal"
          align-items="center"
          role="list"
          class="p-4">
          <nord-button
            disabled={props.pagination.page <= 1}
            role="listitem"
            onClick={() => props.pagination.onChange(props.pagination.page - 1, props.pagination.pageSize)}>
            <nord-icon
              name="arrow-left-small"
              label="Previous"
            />
          </nord-button>
          <Show when={props.pagination.page() > 5}>
            <p
              class="n-padding-i-m n-color-text-weaker"
              aria-hidden="true">
              …
            </p>
          </Show>
          <For each={pageList()}>
            {pageNumber => (
              <nord-button
                onClick={() => props.pagination.onChange(pageNumber, props.pagination.pageSize)}
                role="listitem"
                variant={pageNumber === props.pagination.page() ? 'primary' : 'plain'}>
                {pageNumber}
              </nord-button>
            )}
          </For>
          <Show when={props.pagination.pageCount - props.pagination.page > 5}>
            <p
              class="n-padding-i-m n-color-text-weaker"
              aria-hidden="true">
              …
            </p>
          </Show>
          <nord-button
            disabled={props.pagination.page >= props.pagination.pageCount}
            role="listitem"
            onClick={() => props.pagination.onChange(props.pagination.page + 1, props.pagination.pageSize)}>
            <nord-icon
              name="arrow-right-small"
              label="Next"
            />
          </nord-button>
          <Show when={props.pagination.pageSizes}>
            <nord-select
              hide-label
              value={props.pagination.pageSize}
              onInput={e => props.pagination.onChange(props.pagination.page, e.target.value)}>
              <For each={props.pagination.pageSizes}>{size => <option value={size}>{size} items/page</option>}</For>
            </nord-select>
          </Show>
          <Show when={props.pagination.total}>
            <nord-button disabled>Total: {props.pagination.total}</nord-button>
          </Show>
        </nord-stack>
      </Show>
    </nord-card>
  );
}

export default Table;
