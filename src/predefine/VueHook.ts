import { onUnmounted, ref, Ref, watch, WatchSource } from 'vue';
import { EffectRequestParams, FrontRequestState } from '../../typings';
import { forEach, objectKeys, trueValue, undefinedValue } from '../utils/variables';

type UnknownRef = Ref<unknown>;
// Vue的预定义hooks
export default {
  create: <D>(data: D) => ref(data),
  export: <D>(state: Ref<D>) => state,
  dehydrate: <D>(state: Ref<D>) => state.value,
  update: (
    newVal: Partial<FrontRequestState>,
    states: FrontRequestState<UnknownRef, UnknownRef, UnknownRef, UnknownRef, UnknownRef>
  ) =>
    forEach(objectKeys(newVal), key => {
      type Keys = keyof FrontRequestState;
      states[key as Keys].value = newVal[key as Keys];
    }),
  effectRequest({ handler, removeStates, immediate, watchingStates }: EffectRequestParams<WatchSource>) {
    onUnmounted(removeStates); // 组件卸载时移除对应状态
    if (!watchingStates) {
      handler();
      return;
    }
    watch(
      watchingStates,
      (newVals = [], oldVals = []) => {
        // 计算变更的值所在索引，以支持debounce对单个监听值的防抖
        let changedIndex: number | undefined = undefinedValue;
        forEach(oldVals, (val, i) => {
          changedIndex = val === undefinedValue || newVals[i] === val ? changedIndex : i;
        });
        handler(changedIndex);
      },
      { immediate, deep: trueValue }
    );
  }
};
