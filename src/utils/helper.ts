import { AlovaMethodHandler, CacheExpire, LocalCacheConfig, Method } from '../../typings';
import {
	clearTimeoutTimer,
	falseValue,
	forEach,
	getConfig,
	getOptions,
	getTime,
	JSONStringify,
	MEMORY,
	nullValue,
	objectKeys,
	PromiseCls,
	promiseThen,
	setTimeoutFn,
	STORAGE_PLACEHOLDER,
	STORAGE_RESTORE,
	undefinedValue
} from './variables';

/**
 * 空函数，做兼容处理
 */
export const noop = () => {};

// 返回自身函数，做兼容处理
export const self = <T>(arg: T) => arg;

/**
 * 判断参数是否为函数
 * @param fn 任意参数
 * @returns 该参数是否为函数
 */
export const isFn = (arg: any): arg is Function => typeof arg === 'function';

/**
 * 判断参数是否为数字
 * @param arg 任意参数
 * @returns 该参数是否为数字
 */
export const isNumber = (arg: any): arg is number => typeof arg === 'number' && !isNaN(arg);

/**
 * 判断参数是否为字符串
 * @param arg 任意参数
 * @returns 该参数是否为字符串
 */
export const isString = (arg: any): arg is string => typeof arg === 'string';

// 判断是否为普通对象
export const isPlainObject = (arg: any): arg is Object => Object.prototype.toString.call(arg) === '[object Object]';

// 判断是否为某个类的实例
export const instanceOf = <T>(arg: any, cls: new (...args: any[]) => T): arg is T => arg instanceof cls;

// 判断是否为数组
export const isArray = (arg: any): arg is any[] => Array.isArray(arg);

/**
 * 获取请求方式的key值
 * @returns {string} 此请求方式的key值
 */
export const key = <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) => {
	const { type, url, requestBody } = methodInstance;
	const { params, headers } = getConfig(methodInstance);
	return JSONStringify([type, url, params, requestBody, headers]);
};

/**
 * 序列化请求方法对象
 * @param methodInstance 请求方法对象
 * @returns 请求方法的序列化对象
 */
export const serializeMethod = <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) => {
	const { type, url, config, requestBody } = methodInstance;
	return {
		type,
		url,
		config,
		requestBody
	};
};

/**
 * 创建防抖函数，只有enable为trueValue时会进入防抖环节，否则将立即触发此函数
 * 场景：在调用useWatcher并设置了immediate为trueValue时，首次调用需立即执行，否则会造成延迟调用
 * @param fn 回调函数
 * @param delay 延迟描述
 * @param enable 是否启用防抖
 * @returns 延迟后的回调函数
 */
export const debounce = (fn: Function, delay: number, enable: () => boolean) => {
	let timer: any = nullValue;
	return function (this: any, ...args: any[]) {
		const bindFn = fn.bind(this, ...args);
		if (!enable()) {
			bindFn();
			return;
		}
		if (timer) {
			clearTimeoutTimer(timer);
		}
		timer = setTimeoutFn(bindFn, delay);
	};
};

/**
 * 获取缓存的配置参数，固定返回{ e: number, m: number, s: boolean, t: string }格式的对象
 * e为expire缩写，表示缓存失效时间点（时间戳），单位为毫秒
 * m为mode缩写，存储模式
 * s为storage缩写，是否存储到本地
 * t为tag缩写，持久化存储标签
 * @param localCache 本地缓存参数
 * @returns 统一的缓存参数对象
 */
export const getLocalCacheConfigParam = <S, E, R, T, RC, RE, RH>(
	methodInstance?: Method<S, E, R, T, RC, RE, RH>,
	localCache?: LocalCacheConfig
) => {
	const _localCache =
		localCache !== undefinedValue
			? localCache
			: methodInstance
			? getOptions(methodInstance).localCache || getConfig(methodInstance).localCache
			: undefinedValue;

	const getCacheExpireTs = (_localCache: CacheExpire) =>
		isNumber(_localCache) ? getTime() + _localCache : getTime(_localCache);
	let cacheMode = MEMORY;
	let expire = 0;
	let storage = falseValue;
	let tag: undefined | string = undefinedValue;
	if (isNumber(_localCache) || instanceOf(_localCache, Date)) {
		expire = getCacheExpireTs(_localCache);
	} else {
		const { mode = MEMORY, expire: configExpire = 0, tag: configTag } = _localCache || {};
		cacheMode = mode;
		expire = getCacheExpireTs(configExpire);
		storage = [STORAGE_PLACEHOLDER, STORAGE_RESTORE].includes(mode);
		tag = configTag ? configTag.toString() : undefinedValue;
	}
	return {
		e: expire,
		m: cacheMode,
		s: storage,
		t: tag
	};
};

/**
 * 获取请求方法对象
 * @param methodHandler 请求方法句柄
 * @param args 方法调用参数
 * @returns 请求方法对象
 */
export const getHandlerMethod = <S, E, R, T, RC, RE, RH>(
	methodHandler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
	args: any[] = []
) => (isFn(methodHandler) ? methodHandler(...args) : methodHandler);

/**
 * 深度走查正在更新的数据，当一个数据以如下格式呈现时，则需要在响应后将它替换为实际数据
 * 1. 完整格式
 * {
        action: 'responsed',
        value: d => d.id,
        default: 0,
    },
    2. 在对象中可以这样简写
    '+id': d => d.id,  // 无默认值情况
    '+id': [d => d.id, 0],  // 有默认值情况
 * @param data 待解析数据
 * @returns 待替换数据的位置，及转换函数
 */
export const walkUpatingDataStructure = (data: any) => {
	const catchedUpdateAttrs: {
		p: (number | string)[];
		h: Function;
	}[] = [];

	// 解析函数
	const parseResponsedStructure = (attr: any, key?: string) => {
		let structure: { h: Function; d?: any } | undefined = undefined;
		if (isPlainObject(attr)) {
			const { action: a, value: h, default: d } = attr;
			if (a === 'responsed' && isFn(h)) {
				structure = { h, d };
			}
		} else if (key && key[0] === '+') {
			if (isFn(attr)) {
				structure = { h: attr };
			} else if (isArray(attr) && isFn(attr[0])) {
				structure = { h: attr[0], d: attr[1] };
			}
		}
		return structure;
	};

	let finalData = data;
	// 遍历对象或数组内的单个项处理
	const replaceStr = (key: string) => key.replace(/^\+/, '');
	const walkItem = (item: any, position: (number | string)[], key?: string | number, parent?: any) => {
		const structure = parseResponsedStructure(item, isString(key) ? key : undefinedValue);
		if (structure) {
			const { h, d } = structure;
			catchedUpdateAttrs.push({
				p: position,
				h
			});
			if (key !== undefinedValue) {
				const keyReplaced = isString(key) ? replaceStr(key) : key;
				if (keyReplaced !== key) {
					delete parent[key];
				}
				parent[keyReplaced] = d;
			} else {
				finalData = d;
			}
		} else if (isPlainObject(item)) {
			// 遍历对象
			forEach(objectKeys(item), key => walkItem(item[key], [...position, replaceStr(key)], key, item));
		} else if (isArray(item)) {
			// 遍历数组
			forEach(item, (arrItem, i) => walkItem(arrItem, [...position, i], i, item));
		}
	};

	walkItem(data, []);
	return {
		f: finalData,
		c: catchedUpdateAttrs
	};
};

/**
 * 统一配置
 * @param 数据
 * @returns 统一的配置
 */
export const sloughConfig = <T>(config: T | (() => T)) => (isFn(config) ? config() : config);

/**
 * 判断目标数据是否为Promise，如果是则在then函数中执行onAfter，否则同步执行onAfter
 * @param target 目标数据
 * @param onAfter 后续回调函数
 * @returns {void}
 */
export const asyncOrSync = <T, R>(target: T, onAfter: (data: T extends Promise<infer D> ? D : T) => R) =>
	instanceOf(target, PromiseCls) ? promiseThen(target, onAfter) : onAfter(target as any);
