import PropTypes from 'prop-types';

function Table({ style = {}, columns, data, loading, title, rowProps }) {
  return (
    <nord-card
      padding="none"
      class="relative">
      {loading ? (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-gray-600 bg-opacity-30 z-10 flex items-center justify-center">
          <nord-spinner></nord-spinner>
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
            {data.map((row, index) => {
              const { onClick, style } = rowProps ? rowProps(row, index) : {};
              return (
                <tr
                  key={index}
                  style={style}
                  onClick={onClick}>
                  {columns.map(({ dataIndex }) => (
                    <td key={dataIndex}>{row[dataIndex]}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </nord-table>
    </nord-card>
  );
}

Table.propTypes = {
  style: PropTypes.object,
  loading: PropTypes.bool,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      dataIndex: PropTypes.string.isRequired
    })
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  title: PropTypes.string,
  rowProps: PropTypes.func
};

export default Table;
