import { createAssert } from '@alova/shared';

// import { get } from '@alova/shared';

/**
 * 自定义断言函数，表达式为false时抛出错误
 * @param expression 判断表达式，true或false
 * @param msg 断言消息
 */
const myAssert = createAssert();
export default myAssert;
