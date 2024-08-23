import { AlovaGenerics, Method } from 'alova';

export type UpdateStateCollection<Responded> = {
  [key: string | number | symbol]: (data: any) => any;
} & {
  data?: (data: Responded) => any;
};
/**
 * cross components to update states by specifing method instance.
 * @example
 * ```js
 * updateState(methodInstance, newData);
 * updateState(methodInstance, oldData => {
 *   oldData.name = 'new name';
 *   return oldData;
 * });
 * ```
 * @param matcher method instance
 * @param handleUpdate new data or update function that returns new data
 * @returns is updated
 */
export declare function updateState<Responded>(
  matcher: Method<AlovaGenerics<Responded extends unknown ? any : Responded>>,
  handleUpdate: UpdateStateCollection<Responded>['data'] | UpdateStateCollection<Responded>
): Promise<boolean>;
