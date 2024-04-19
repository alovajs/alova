import { Method } from '..';
import alovaError from './alovaError';

/**
 * 自定义断言函数，表达式为false时抛出错误
 * @param expression 判断表达式，true或false
 * @param msg 断言消息
 */
export default function myAssert(expression: boolean, msg: string) {
  if (!expression) {
    throw alovaError(msg);
  }
}

/**
 * 断言是否匹配到method实例
 * @param methodInstance method实例
 */
export const assertMethodMatcher = (methodInstance?: Method) =>
  myAssert(!!methodInstance, "didn't match any method instance");
