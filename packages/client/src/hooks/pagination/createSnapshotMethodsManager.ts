import { falseValue, getMethodInternalKey, instanceOf } from '@alova/shared';
import { AlovaGenerics, Method } from 'alova';

interface SnapshotValue<AG extends AlovaGenerics> {
  entity: Method<AG>;
  total?: number;
}
export default <AG extends AlovaGenerics>(handler: (page: number) => Method<AG>) => {
  let methodSnapshots = {} as Record<string, SnapshotValue<AG>>;

  return {
    snapshots: () => methodSnapshots,
    save(methodInstance: Method<AG>, force = falseValue) {
      const key = getMethodInternalKey(methodInstance);
      // Because it is impossible to locate the location of the total data in the cache
      // Therefore, this field is maintained redundantly here.
      if (!methodSnapshots[key] || force) {
        methodSnapshots[key] = {
          entity: methodInstance
        };
      }
    },
    get: (entityOrPage: Method<AG> | number) =>
      methodSnapshots[
        getMethodInternalKey(instanceOf(entityOrPage, Method<AG>) ? entityOrPage : handler(entityOrPage))
      ],
    remove(key?: string) {
      if (key) {
        delete methodSnapshots[key];
      } else {
        methodSnapshots = {};
      }
    }
  };
};
