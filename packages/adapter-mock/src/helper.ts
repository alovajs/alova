/**
 * 解析url
 * @param url url
 * @returns 解析后的信息对象
 */
export const parseUrl = (url: string) => {
  url = /^[^/]*\/\//.test(url) ? url : `//${url}`;
  const splitedFullPath = url.split('/').slice(3);
  const query = {} as Record<string, string>;
  let pathContainedParams = splitedFullPath.pop();
  let pathname = '';
  let hash = '';
  if (pathContainedParams) {
    pathContainedParams = pathContainedParams.replace(/\?[^?#]+/, mat => {
      // 解析url参数
      mat
        .substring(1)
        .split('&')
        .forEach(paramItem => {
          const [key, value] = paramItem.split('=');
          key && (query[key] = value);
        });
      return '';
    });
    pathContainedParams = pathContainedParams.replace(/#[^#]*/, mat => {
      hash = mat;
      return '';
    });
    splitedFullPath.push(pathContainedParams);
    pathname = `/${splitedFullPath.join('/')}`;
  }
  return {
    pathname,
    query,
    hash
  };
};

export const tt = {};
