import { newInstance } from './function';

/**
 * 构建格式化的错误消息
 * @param prefix 错误前缀
 * @param msg 错误消息
 * @returns 格式化的错误消息
 */
export const buildErrorMsg = (prefix: string, msg: string) => `[alova${prefix ? `\\${prefix}` : ''}]${msg}`;

/**
 * 自定义断言函数，表达式为false时抛出错误
 * @param expression 判断表达式，true或false
 * @param msg 断言消息
 */
export const createAssert =
  (prefix = '') =>
  (expression: boolean, msg: string) => {
    if (!expression) {
      throw newInstance(Error, buildErrorMsg(prefix, msg));
    }
  };
