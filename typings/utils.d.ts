/**
 * Merge工具类型将T对象,U元组对象合并
 */
declare type Merge<T extends Record<string, any>, U extends Record<string, any>[]> = U extends [
  infer First,
  ...infer Rest
]
  ? Merge<First & Omit<T, keyof First>, Rest>
  : T;
/**
 * UnionToIntersection工具类将联合类型转为交叉类型
 */
declare type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

declare type ExpectTrue<T extends true> = T;
declare type ExpectFalse<T extends false> = T;

declare type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
