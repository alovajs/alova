import { DataSerializer } from '~/typings/general';
import dateSerializer from './date';
import regexpSerializer from './regexp';
import { isObject, walkObject } from '@alova/shared/function';
import { undefinedValue, objectKeys, ObjectCls, len, falseValue, isArray } from '@alova/shared/vars';

const createSerializerPerformer = (customSerializers: Record<string | number, DataSerializer> = {}) => {
  /**
   * 合并内置序列化器和自定义序列化器
   */
  const serializers = {
    date: dateSerializer,
    regexp: regexpSerializer,
    ...customSerializers
  } as typeof customSerializers;

  /**
   * 序列化数据
   */
  const serialize = (payload: any) => {
    if (isObject(payload)) {
      payload = walkObject(isArray(payload) ? [...payload] : { ...payload }, value => {
        let finallyApplySerializerName = undefinedValue as string | undefined;
        // 找到匹配的序列化器并进行值的序列化，未找到则返回原值
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

        // 需要用原始值判断，否则像new Number(1)等包装类也会是[object Object]
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
   * 反序列化数据
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
