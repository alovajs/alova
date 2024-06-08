/**
 * Merge工具类型将T对象,U元组对象合并
 */
declare type Merge<T extends Record<string, any>, U extends Record<string, any>[]> = T & UnionToIntersection<U[number]>;
/**
 * UnionToIntersection工具类将联合类型转为交叉类型
 */
declare type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
