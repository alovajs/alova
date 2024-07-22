import { newInstance } from './function';

/**
 * alova错误类
 */
export class AlovaError extends Error {
  constructor(prefix: string, message: string, errorCode?: number) {
    super(message + (errorCode ? `\n\nFor detailed: https://alova.js.org/error#${errorCode}` : ''));
    this.name = `[alova${prefix ? `/${prefix}` : ''}]`;
  }
}

/**
 * 自定义断言函数，表达式为false时抛出错误
 * 当传入了errorCode时，将提供链接到错误文档，引导用户改正
 * @param expression 判断表达式，true或false
 * @param message 断言消息
 */
export const createAssert =
  (prefix = '') =>
  (expression: boolean, message: string, errorCode?: number) => {
    if (!expression) {
      throw newInstance(AlovaError, prefix, message, errorCode);
    }
  };
