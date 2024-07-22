import PropTypes from 'prop-types';

function Table({ style = {}, columns, data, loading, title, rowProps, pagination }) {
  const getPageList = (page, pageCount) => {
    const start = Math.max(page - 2, 1);
    const end = Math.min(start + 4, pageCount);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <nord-card
      padding="none"
      class="relative">
      {loading ? (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-gray-600 bg-opacity-30 z-10 flex items-center justify-center">
          <nord-spinner />
        </div>
      ) : null}
      {title ? (
        <h3
          className="text-lg"
          slot="header">
          {title}
        </h3>
      ) : null}
      <nord-table style={style}>
        <table>
          <thead>
            <tr>
              {columns.map(({ title, dataIndex }) => (
                <th key={dataIndex}>{title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, index) => {
                const props = rowProps ? rowProps(row, index) : {};
                return (
                  <tr
                    key={index}
                    {...props}>
                    {columns.map(({ dataIndex, render }) => (
                      <td key={dataIndex}>
                        {typeof render === 'function' ? render(row[dataIndex], row) : row[dataIndex]}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length}>No Data</td>
              </tr>
            )}
          </tbody>
        </table>
      </nord-table>

      {pagination ? (
        <nord-stack
          direction="horizontal"
          align-items="center"
          role="list"
          class="p-4">
          <nord-button
            disabled={pagination.page <= 1 || undefined}
            role="listitem"
            onClick={() => pagination.onChange(pagination.page - 1, pagination.pageSize)}>
            <nord-icon
              name="arrow-left-small"
              label="Previous"
            />
          </nord-button>
          {pagination.page > 5 ? (
            <p
              className="n-padding-i-m n-color-text-weaker"
              aria-hidden="true">
              …
            </p>
          ) : null}

          {getPageList(pagination.page, pagination.pageCount).map(pageNumber => (
            <nord-button
              onClick={() => pagination.onChange(pageNumber, pagination.pageSize)}
              key={pageNumber}
              role="listitem"
              variant={pageNumber === pagination.page ? 'primary' : 'plain'}>
              {pageNumber}
            </nord-button>
          ))}
          {pagination.pageCount - pagination.page > 5 ? (
            <p
              className="n-padding-i-m n-color-text-weaker"
              aria-hidden="true">
              …
            </p>
          ) : null}
          <nord-button
            disabled={pagination.page >= pagination.pageCount || undefined}
            role="listitem"
            onClick={() => pagination.onChange(pagination.page + 1, pagination.pageSize)}>
            <nord-icon
              name="arrow-right-small"
              label="Next"
            />
          </nord-button>

          {pagination.pageSizes ? (
            <nord-select
              hide-label
              value={pagination.pageSize}
              onInput={({ target }) => pagination.onChange(pagination.page, target.value)}>
              {pagination.pageSizes.map(size => (
                <option
                  key={size}
                  value={size}>
                  {size} items/page
                </option>
              ))}
            </nord-select>
          ) : null}
          {pagination.total ? <nord-button disabled>Total: {pagination.total}</nord-button> : null}
        </nord-stack>
      ) : null}
    </nord-card>
  );
}

Table.propTypes = {
  style: PropTypes.object,
  loading: PropTypes.bool,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      dataIndex: PropTypes.string.isRequired,
      render: PropTypes.func
    })
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  title: PropTypes.string,
  rowProps: PropTypes.func,
  pagination: PropTypes.object
};

export default Table;
