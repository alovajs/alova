import { instanceOf } from '@alova/shared/function';
import { falseValue } from '@alova/shared/vars';
import { getMethodKey, Method } from 'alova';

interface SnapshotValue {
  entity: Method;
  total?: number;
}
export default (handler: (page: number) => Method) => {
  let methodSnapshots = {} as Record<string, SnapshotValue>;

  return {
    snapshots: () => methodSnapshots,
    save(methodInstance: Method, force = falseValue) {
      const key = getMethodKey(methodInstance);
      // 因为无法定位缓存中total数据的位置
      // 因此这边冗余维护这个字段
      if (!methodSnapshots[key] || force) {
        methodSnapshots[key] = {
          entity: methodInstance
        };
      }
    },
    get: (entityOrPage: Method | number) =>
      methodSnapshots[getMethodKey(instanceOf(entityOrPage, Method) ? entityOrPage : handler(entityOrPage))],
    remove(key?: string) {
      if (key) {
        delete methodSnapshots[key];
      } else {
        methodSnapshots = {};
      }
    }
  };
};
