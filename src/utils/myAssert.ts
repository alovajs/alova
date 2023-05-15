import { alovas } from '@/Alova';
import { Method } from '..';
import alovaError from './alovaError';
import { len } from './variables';

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
 * 断言是否创建了alova实例
 */
export const assertAlovaCreation = () => myAssert(len(alovas) > 0, 'please create a alova instance first.');

/**
 * 断言method实例是否存在
 * @param methodInstance method实例
 */
export const assertMethodMatcher = (methodInstance?: Method) =>
  myAssert(!!methodInstance, "Didn't match any method instance");
