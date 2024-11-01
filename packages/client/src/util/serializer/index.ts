import { ObjectCls, falseValue, isArray, isObject, len, objectKeys, undefinedValue, walkObject } from '@alova/shared';
import { DataSerializer } from '~/typings/clienthook';
import dateSerializer from './date';
import regexpSerializer from './regexp';

const createSerializerPerformer = (customSerializers: Record<string | number, DataSerializer> = {}) => {
  /**
   * Merge built-in serializers and custom serializers
   */
  const serializers = {
    date: dateSerializer,
    regexp: regexpSerializer,
    ...customSerializers
  } as typeof customSerializers;

  /**
   * serialized data
   */
  const serialize = (payload: any) => {
    if (isObject(payload)) {
      payload = walkObject(isArray(payload) ? [...payload] : { ...payload }, value => {
        let finallyApplySerializerName = undefinedValue as string | undefined;
        // Find a matching serializer and serialize the value. If not found, return the original value.
        const serializedValue = objectKeys(serializers).reduce((currentValue, serializerName) => {
          if (!finallyApplySerializerName) {
            const serializedValueItem = serializers[serializerName].forward(currentValue);
            if (serializedValueItem !== undefinedValue) {
              finallyApplySerializerName = serializerName;
              currentValue = serializedValueItem;
            }
          }
          return currentValue;
        }, value);

        // You need to use the original value to judge, otherwise packaging classes such as new Number(1) will also be [object Object]
        const toStringTag = ObjectCls.prototype.toString.call(value);
        if (toStringTag === '[object Object]') {
          value = { ...value };
        } else if (isArray(value)) {
          value = [...value];
        }
        return finallyApplySerializerName !== undefinedValue ? [finallyApplySerializerName, serializedValue] : value;
      });
    }
    return payload;
  };

  /**
   * Deserialize data
   */
  const deserialize = (payload: any) =>
    isObject(payload)
      ? walkObject(
          payload,
          value => {
            if (isArray(value) && len(value) === 2) {
              const foundSerializer = serializers[value[0]];
              value = foundSerializer ? foundSerializer.backward(value[1]) : value;
            }
            return value;
          },
          falseValue
        )
      : payload;

  return {
    serialize,
    deserialize
  };
};
export default createSerializerPerformer;
