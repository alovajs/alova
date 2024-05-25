import createSerializerPerformer from '@/util/serializer';
import { walkObject, instanceOf, isObject } from '@alova/shared/function';
import { undefinedValue, falseValue, ObjectCls, len, objectKeys, isArray, forEach, includes } from '@alova/shared/vars';
import { customSerializers, dependentAlovaInstance, silentAssert } from '../globalVariables';
import createVirtualResponse from '../virtualResponse/createVirtualResponse';
import { dehydrateVDataUnified } from '../virtualResponse/dehydrateVData';
import { symbolVDataId } from '../virtualResponse/variables';

export type SerializedSilentMethodIdQueueMap = Record<string, string[]>;
const vDataKey = '__$k';
const vDataValueKey = '__$v';
const getAlovaStorage = () => {
  // 未启动silentFactory时提供提示
  silentAssert(
    !!dependentAlovaInstance,
    'alova instance is not found, Do you forget to set `alova` or call `bootSilentFactory`?'
  );
  return dependentAlovaInstance.l2Cache;
};

let serializerPerformer: ReturnType<typeof createSerializerPerformer> | undefined = undefinedValue;
export const silentMethodIdQueueMapStorageKey = 'alova.SQ'; // silentMethod实例id组成的队列集合缓存key
export const silentMethodStorageKeyPrefix = 'alova.SM.'; // silentMethod实例缓存key前缀
/**
 * 持久化带虚拟数据和可序列化的数据集合
 * @param key 持久化key
 * @param payload 持久化数据
 */
export const storageSetItem = (key: string, payload: any) => {
  const storage = getAlovaStorage();
  if (isObject(payload)) {
    payload = walkObject(isArray(payload) ? [...payload] : { ...payload }, (value, key, parent) => {
      if (key === vDataValueKey && parent[vDataKey]) {
        return value;
      }

      // 如果序列化的是silentMethod实例，则过滤掉alova实例
      if (key === 'context' && value?.constructor?.name === 'Alova') {
        return undefinedValue;
      }
      const vDataId = value?.[symbolVDataId];
      let primitiveValue = dehydrateVDataUnified(value, falseValue);

      // 需要用原始值判断，否则像new Number(1)等包装类也会是[object Object]
      const toStringTag = ObjectCls.prototype.toString.call(primitiveValue);
      if (toStringTag === '[object Object]') {
        value = { ...value };
        primitiveValue = {};
      } else if (isArray(value)) {
        value = [...value];
        primitiveValue = [];
      }

      if (vDataId) {
        const valueWithVData = {
          [vDataKey]: vDataId,

          // 对于对象和数组来说，它内部的属性会全部通过`...value`放到外部，因此内部的不需要再进行遍历转换了
          // 因此将数组或对象置空，这样既避免了重复转换，又避免了污染原对象
          [vDataValueKey]: primitiveValue,
          ...value
        };
        // 如果是String类型，将会有像数组一样的如0、1、2为下标，值为字符的项，需将他们过滤掉
        if (instanceOf(value, String)) {
          for (let i = 0; i < len(value as string); i += 1) {
            delete valueWithVData?.[i];
          }
        }
        // 如果转换成了虚拟数据，则将转换值赋给它内部，并在下面逻辑中统一由value处理
        value = valueWithVData;
      }
      return value;
    });
  }
  serializerPerformer = serializerPerformer || createSerializerPerformer(customSerializers);
  storage.set(key, serializerPerformer.serialize(payload));
};
/**
 * 取出持久化数据，并数据转换虚拟数据和已序列化数据
 * @param key 持久化数据的key
 */
export const storageGetItem = (key: string) => {
  const storagedResponse = getAlovaStorage().get(key);
  serializerPerformer = serializerPerformer || createSerializerPerformer(customSerializers);
  return isObject(storagedResponse)
    ? walkObject(
        serializerPerformer.deserialize(storagedResponse),
        value => {
          // 将虚拟数据格式转换回虚拟数据实例
          if (isObject(value) && value?.[vDataKey]) {
            const vDataId = value[vDataKey];
            const vDataValue = createVirtualResponse(value[vDataValueKey], vDataId);
            forEach(objectKeys(value), key => {
              if (!includes([vDataKey, vDataValueKey], key)) {
                vDataValue[key] = value[key];
              }
            });
            value = vDataValue;
          }
          return value;
        },
        falseValue
      )
    : storagedResponse;
};
/**
 * 移除持久化数据
 * @param key 持久化数据的key
 */
export const storageRemoveItem = (key: string) => {
  getAlovaStorage().remove(key);
};
