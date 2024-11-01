import createSerializerPerformer from '@/util/serializer';
import {
  falseValue,
  forEach,
  globalToString,
  includes,
  instanceOf,
  isArray,
  isObject,
  len,
  objectKeys,
  undefinedValue,
  walkObject
} from '@alova/shared';
import { AlovaGlobalCacheAdapter } from 'alova';
import { customSerializers, dependentAlovaInstance, silentAssert } from '../globalVariables';
import createVirtualResponse from '../virtualResponse/createVirtualResponse';
import { dehydrateVDataUnified } from '../virtualResponse/dehydrateVData';
import { symbolVDataId } from '../virtualResponse/variables';

export type SerializedSilentMethodIdQueueMap = Record<string, string[]>;
const vDataKey = '__$k';
const vDataValueKey = '__$v';
const getAlovaStorage = () => {
  // Provide prompt when silent factory is not started
  silentAssert(
    !!dependentAlovaInstance,
    'alova instance is not found, Do you forget to set `alova` or call `bootSilentFactory`?'
  );
  return dependentAlovaInstance.l2Cache as AlovaGlobalCacheAdapter;
};

let serializerPerformer: ReturnType<typeof createSerializerPerformer> | undefined = undefinedValue;
export const silentMethodIdQueueMapStorageKey = 'alova.SQ'; // Queue collection cache key composed of Silent method instance id
export const silentMethodStorageKeyPrefix = 'alova.SM.'; // silentMethod instance cache key prefix
/**
 * Persistence of data collections with dummy data and serializable data
 * @param key persistence key
 * @param payload Persistent data
 */
export const storageSetItem = async (key: string, payload: any) => {
  const storage = getAlovaStorage();
  if (isObject(payload)) {
    payload = walkObject(isArray(payload) ? [...payload] : { ...payload }, (value, key, parent) => {
      if (key === vDataValueKey && parent[vDataKey]) {
        return value;
      }

      // If a silent method instance is serialized, the alova instance is filtered out
      if (key === 'context' && value?.constructor?.name === 'Alova') {
        return undefinedValue;
      }
      const vDataId = value?.[symbolVDataId];
      let primitiveValue = dehydrateVDataUnified(value, falseValue);

      // You need to use the original value to judge, otherwise packaging classes such as new Number(1) will also be [object Object]
      const toStringTag = globalToString(primitiveValue);
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

          // For objects and arrays, all their internal properties will be put to the outside through `...value`, so the internal ones do not need to be traversed and converted.
          // Therefore, empty the array or object to avoid repeated conversions and contamination of the original object.
          [vDataValueKey]: primitiveValue,
          ...value
        };
        // If it is a string type, there will be items like arrays such as 0, 1, and 2 as subscripts and values as characters, and they need to be filtered out.
        if (instanceOf(value, String)) {
          for (let i = 0; i < len(value as string); i += 1) {
            delete valueWithVData?.[i];
          }
        }
        // If it is converted into virtual data, the converted value is assigned to it internally, and is uniformly processed by value in the following logic.
        value = valueWithVData;
      }
      return value;
    });
  }
  serializerPerformer = serializerPerformer || createSerializerPerformer(customSerializers);
  await storage.set(key, serializerPerformer.serialize(payload));
};
/**
 * Take out the persistent data and convert the data into virtual data and serialized data
 * @param key Key to persistent data
 */
export const storageGetItem = async (key: string) => {
  const storagedResponse = await getAlovaStorage().get(key);
  serializerPerformer = serializerPerformer || createSerializerPerformer(customSerializers);
  return isObject(storagedResponse)
    ? walkObject(
        serializerPerformer.deserialize(storagedResponse),
        value => {
          // Convert virtual data format back to virtual data instance
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
 * Remove persistent data
 * @param key Key to persistent data
 */
export const storageRemoveItem = async (key: string) => {
  await getAlovaStorage().remove(key);
};
