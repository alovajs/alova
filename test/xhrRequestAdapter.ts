import { isPlainObject, isSpecialRequestBody, isString, noop } from '@/utils/helper';
import { AlovaRequestAdapter, ProgressUpdater } from '~/typings';

/**
 * xhr请求配置参数
 */
interface AlovaXHRRequestConfig {
  /**
   * 设置响应数据类型。
   *
   * 可以设置更改响应类型。 值为：“arraybuffer”、“blob”、“document”、“json”和“text”。
   * 设置1：如果当前全局对象不是 Window 对象，则忽略设置为“文档”。
   * 设置2：如果状态正在加载或完成，则抛出“InvalidStateError”DOMException。
   * 设置3：如果设置了同步标志且当前全局对象是 Window 对象，则抛出“InvalidAccessError”DOMException。
   * @default "json"
   */
  responseType?: XMLHttpRequestResponseType;

  /**
   * 当凭证要包含在跨源请求中时为true。 当它们被排除在跨源请求中以及当 cookie 在其响应中被忽略时为 false。 默认为false。
   * 如果状态未发送或未打开，或者设置了send() 标志，则抛出“InvalidStateError”DOMException。
   * @default false
   */
  withCredentials?: boolean;

  /**
   * 设置响应数据的mimeType
   */
  mimeType?: string;

  /**
   * `auth` 表示应该使用 HTTP Basic 身份验证，并提供凭据。
   * 这将设置一个 `Authorization` 标头，覆盖任何现有的
   * 使用 `headers` 设置的 `Authorization` 自定义标头。
   * 请注意，只有 HTTP Basic 身份验证可以通过此参数进行配置。
   * 对于 Bearer 令牌等，请改用 `Authorization` 自定义标头。
   */
  auth?: {
    username: string;
    password: string;
  };
}

/**
 * 响应头信息
 */
interface AlovaXHRResponseHeaders {
  [x: string]: any;
}

/**
 * 响应数据结构
 */
interface AlovaXHRResponse<T = any> {
  status: number;
  statusText: string;
  data: T;
  headers: AlovaXHRResponseHeaders;
}

const isBodyData = (data: any): data is XMLHttpRequestBodyInit => isString(data) || isSpecialRequestBody(data);

/**
 * 创建错误对象
 * @param message 错误信息
 * @returns 错误对象
 */
export const err = (message: string) => new Error(message);

/**
 * 将对象转换为queryString字符串
 * 支持任意层级的数组或对象
 * @param data 转换的data实例
 */
export const data2QueryString = (data: Record<string, any>) => {
  const ary: string[] = [];
  let paths: string[] = [];
  let index = 0;
  let refValueAttrCount = 0;

  // 利用JSON.stringify来深度遍历数据
  JSON.stringify(data, (key, value) => {
    if (key !== '') {
      // 如果是引用类型（数组或对象）则进入记录路径
      if (typeof value === 'object' && value !== null) {
        paths.push(key);
        // 记录接下来路径的使用次数
        // 需要使用累加的方式，原因如下:
        /**
         * { a: [1, { b: 2 }] }
         */
        // 在数组中又包含数组或对象，此时refValueAttrCount还需要给{ b: 2 }使用一次，因此是累加的方式
        refValueAttrCount += Object.keys(value).length;
      } else if (value !== undefined) {
        // 值为undefined不被加入到query string中
        const pathsTransformed = [...paths, key].map((val, i) => (i > 0 ? `[${val}]` : val)).join('');
        ary.push(`${pathsTransformed}=${value}`);

        // 路径次数使用完了，重置标记信息
        // 否则index++来记录当前使用的次数
        if (index >= refValueAttrCount - 1) {
          paths = [];
          index = refValueAttrCount = 0;
        } else {
          index++;
        }
      }
    }
    return value;
  });
  return ary.join('&');
};
/**
 * 解析响应头
 * @param headerString 响应头字符串
 * @returns 响应头对象
 */
export const parseResponseHeaders = (headerString: string) => {
  const headersAry = headerString.trim().split(/[\r\n]+/);
  const headersMap = {} as AlovaXHRResponseHeaders;
  headersAry.forEach(line => {
    const [headerName, value] = line.split(/:\s*/);
    headersMap[headerName] = value;
  });
  return headersMap;
};

/**
 * XMLHttpRequest请求适配器类型
 * @alova/adapter-xhr中的AlovaXHRAdapter内部引用了alova，因此这边不可用，只能自行定义一个类型使用
 */
export type AlovaXHRAdapter = AlovaRequestAdapter<
  any,
  any,
  AlovaXHRRequestConfig,
  AlovaXHRResponse,
  AlovaXHRResponseHeaders
>;
/**
 * XMLHttpRequest请求适配器
 */
const xhrRequestAdapter: AlovaXHRAdapter = ({ type, url, data = null, headers }, method) => {
  const { config } = method;
  const { auth, withCredentials, mimeType } = config;
  let downloadHandler: ProgressUpdater = noop;
  let uploadHandler: ProgressUpdater = noop;

  let xhr: XMLHttpRequest;
  const responsePromise = new Promise<AlovaXHRResponse>((resolve, reject) => {
    try {
      xhr = new XMLHttpRequest();
      xhr.open(type, url, true, auth?.username, auth?.password);
      xhr.responseType = config.responseType || 'json';
      xhr.timeout = config.timeout || 0;

      if (withCredentials === true) {
        xhr.withCredentials = withCredentials;
      }

      // 设置mimeType
      if (mimeType) {
        xhr.overrideMimeType(mimeType);
      }

      // 设置请求头
      let isContentTypeSet = false;
      let isContentTypeFormUrlEncoded = false;
      Object.keys(headers).forEach(headerName => {
        if (/content-type/i.test(headerName)) {
          isContentTypeSet = true;
          isContentTypeFormUrlEncoded = /application\/x-www-form-urlencoded/i.test(headers[headerName]);
        }
        xhr.setRequestHeader(headerName, headers[headerName]);
      });

      // Content-Type在未指定时默认使用application/json; charset=UTF-8
      if (!isContentTypeSet && (data ? data.toString() !== '[object FormData]' : true)) {
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
      }

      // 监听下载事件
      xhr.onprogress = event => {
        downloadHandler(event.loaded, event.total);
      };

      // 监听上传事件
      xhr.upload.onprogress = event => {
        uploadHandler(event.loaded, event.total);
      };

      // 请求成功事件
      xhr.onload = () => {
        resolve({
          status: xhr.status,
          statusText: xhr.statusText,
          data: xhr.response,
          headers: parseResponseHeaders(xhr.getAllResponseHeaders())
        });
      };

      // 请求错误事件
      xhr.onerror = () => {
        reject(err('Network Error'));
      };
      // 请求超时事件
      xhr.ontimeout = () => {
        reject(err('Network Timeout'));
      };
      // 中断事件
      xhr.onabort = () => {
        reject(err('The user aborted a request'));
      };

      // 如果请求头中的Content-Type是application/x-www-form-urlencoded时，将body数据转换为queryString
      let dataSend: any = data;
      if (isContentTypeFormUrlEncoded && isPlainObject(dataSend)) {
        dataSend = data2QueryString(dataSend);
      }
      // GET请求时为null，此时不需要进入处理
      if (dataSend !== null) {
        dataSend = isBodyData(dataSend) ? dataSend : JSON.stringify(dataSend);
      }
      xhr.send(dataSend);
    } catch (error) {
      reject(error);
    }
  });

  return {
    response: () => responsePromise,
    headers: () => responsePromise.then(res => res.headers),
    abort: () => {
      xhr.abort();
    },
    onDownload: handler => {
      downloadHandler = handler;
    },
    onUpload: handler => {
      uploadHandler = handler;
    }
  };
};

export default xhrRequestAdapter;
