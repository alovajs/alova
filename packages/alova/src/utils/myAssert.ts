import { createAssert } from '@alova/shared';

/**
 * Custom assertion function, throws an error when the expression is false
 * @param expression Judgment expression, true or false
 * @param msg assert message
 */
const myAssert = createAssert();
export default myAssert;
