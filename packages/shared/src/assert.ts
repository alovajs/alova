import { newInstance } from './function';

/**
 * 构建格式化的错误消息
 * @param prefix 错误前缀
 * @param msg 错误消息
 * @returns 格式化的错误消息
 */
export const buildErrorMsg = (prefix: string, msg: string) => `[alova${prefix ? `/${prefix}` : ''}]${msg}`;

/**
 * 自定义断言函数，表达式为false时抛出错误
 * 当传入了errorCode时，将提供链接到错误文档，引导用户改正
 * @param expression 判断表达式，true或false
 * @param msg 断言消息
 */
export const createAssert =
  (prefix = '') =>
  (expression: boolean, msg: string, errCode?: number) => {
    if (!expression) {
      throw newInstance(
        Error,
        buildErrorMsg(prefix, msg + (errCode ? `\n\nFor detailed: https://alova.js.org/err#${errCode}` : ''))
      );
    }
  };
