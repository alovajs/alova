import { instanceOf } from '@alova/shared/function';
import { falseValue } from '@alova/shared/vars';
import { AlovaGenerics, getMethodKey, Method } from 'alova';

interface SnapshotValue<AG extends AlovaGenerics> {
  entity: Method<AG>;
  total?: number;
}
export default <AG extends AlovaGenerics>(handler: (page: number) => Method<AG>) => {
  let methodSnapshots = {} as Record<string, SnapshotValue<AG>>;

  return {
    snapshots: () => methodSnapshots,
    save(methodInstance: Method<AG>, force = falseValue) {
      const key = getMethodKey<AG>(methodInstance);
      // 因为无法定位缓存中total数据的位置
      // 因此这边冗余维护这个字段
      if (!methodSnapshots[key] || force) {
        methodSnapshots[key] = {
          entity: methodInstance
        };
      }
    },
    get: (entityOrPage: Method<AG> | number) =>
      methodSnapshots[getMethodKey(instanceOf(entityOrPage, Method<AG>) ? entityOrPage : handler(entityOrPage))],
    remove(key?: string) {
      if (key) {
        delete methodSnapshots[key];
      } else {
        methodSnapshots = {};
      }
    }
  };
};
