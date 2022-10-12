import { onDestroy } from 'svelte';
import { writable, Writable } from 'svelte/store';
import { EffectRequestParams, FrontRequestState } from '../../typings';
import { clearTimeoutTimer, forEach, objectKeys, setTimeoutFn, trueValue, undefinedValue } from '../utils/variables';

type UnknownWritable = Writable<unknown>;
export default {
	create: <D>(data: D): Writable<D> => writable(data),
	export: <D>(state: Writable<D>) => state,
	dehydrate: <D>(state: Writable<D>) => {
		let raw;
		// 订阅时会立即执行一次函数，获取到值后立即调用解除订阅函数
		state.subscribe(value => (raw = value))();
		return raw;
	},
	update: (
		newVal: Partial<FrontRequestState>,
		states: FrontRequestState<UnknownWritable, UnknownWritable, UnknownWritable, UnknownWritable, UnknownWritable>
	) =>
		forEach(objectKeys(newVal), key => {
			type Keys = keyof FrontRequestState;
			const sItem = states[key as Keys];
			sItem.set(newVal[key as Keys]);
		}),
	effectRequest({ handler, removeStates, immediate, watchingStates }: EffectRequestParams) {
		onDestroy(removeStates); // 组件卸载时移除对应状态
		if (!watchingStates) {
			handler();
			return;
		}

		let timer: any;
		let needEmit = immediate;
		forEach(watchingStates, state => {
			state.subscribe(() => {
				timer && clearTimeoutTimer(timer);
				timer = setTimeoutFn(() => {
					// svelte的writable默认会触发一次，因此当immediate=false时需要过滤掉第一次触发调用
					needEmit ? handler() : (needEmit = trueValue);
					timer = undefinedValue;
				}, 10);
			});
		});
	}
};
