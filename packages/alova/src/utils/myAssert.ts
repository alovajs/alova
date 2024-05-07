import { createAssert } from '@alova/shared/assert';
import { instanceOf } from '@alova/shared/function';
import { Method } from '~/typings';

// import { get } from '@alova/shared';

/**
 * 自定义断言函数，表达式为false时抛出错误
 * @param expression 判断表达式，true或false
 * @param msg 断言消息
 */
const myAssert = createAssert();
export default myAssert;

/**
 * 断言是否为method实例
 * @param methodInstance method实例
 */
export const assertMethod = (methodInstance?: Method) =>
  myAssert(instanceOf(methodInstance, Method), 'expected a method instance.');
