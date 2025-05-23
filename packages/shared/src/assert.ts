import { newInstance } from './function';

/**
 * alova error class
 */
export class AlovaError extends Error {
  constructor(prefix: string, message: string, errorCode?: number) {
    super(message + (errorCode ? `\n\nFor detailed: https://alova.js.org/error#${errorCode}` : ''));
    this.name = `[alova${prefix ? `/${prefix}` : ''}]`;
  }
}

/**
 * Custom assertion function that throws an error when the expression is false
 * When errorCode is passed in, a link to the error document will be provided to guide the user to correct it.
 * @param expression Judgment expression, true or false
 * @param message Assert message
 */
export const createAssert =
  (prefix = '') =>
  (expression: any, message: string, errorCode?: number): asserts expression => {
    if (!expression) {
      throw newInstance(AlovaError, prefix, message, errorCode);
    }
  };
