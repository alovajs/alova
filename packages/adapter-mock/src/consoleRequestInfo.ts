import { MockRequestLoggerAdapter } from '~/typings';

// Predefined styles and fixed text
const mockLabel = 'mock';
const mockLabelColor = '#64bde8';
const mockLabelBg = '#ccefff';
const realRequestLabel = 'Realtime';
const realRequestLabelColor = '#999999';
const realRequestLabelBg = '#ededed';
const labelStyle = (bgColor: string, color: string) => `padding: 2px 6px; background: ${bgColor}; color: ${color};`;
const titleStyle = 'color: black; font-size: 12px; font-weight: bolder';
const transform2TableData = (obj: AnyObject) => {
  const tableData = {} as AnyObject;
  for (const key in obj) {
    tableData[key] = { value: obj[key] };
  }
  return tableData;
};

type AnyObject = Record<string, any>;
// Print request information, dedicated to simulated data requests
const consoleRequestInfo: MockRequestLoggerAdapter = ({
  isMock,
  url,
  method,
  headers,
  query,
  data,
  responseHeaders,
  response
}) => {
  const cole = console;
  cole.groupCollapsed(
    `%c${isMock ? mockLabel : realRequestLabel}`,
    labelStyle(isMock ? mockLabelBg : realRequestLabelBg, isMock ? mockLabelColor : realRequestLabelColor),
    url
  );

  // Request method
  cole.log('%c[Method]', titleStyle, method.toUpperCase());

  // OutputRequestHeaders
  cole.log('%c[Request Headers]', titleStyle);
  cole.table(transform2TableData(headers));

  // 输出Query String Parameters
  cole.log('%c[Query String Parameters]', titleStyle);
  cole.table(transform2TableData(query));

  // Output request body
  cole.log('%c[Request Body]', titleStyle, data || '');

  // Output response body
  if (isMock) {
    // When the response header has data, output Response Headers
    if (Object.keys(responseHeaders).length > 0) {
      cole.log('%c[Response Headers]', titleStyle);
      cole.table(transform2TableData(responseHeaders));
    }
    cole.log('%c[Response Body]', titleStyle, response || '');
  }
  cole.groupEnd();
};

export default consoleRequestInfo;
