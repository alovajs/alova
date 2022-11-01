import { Method, MethodFilter, MethodFilterHandler } from '../../typings';
import { instanceOf, isPlainObject, isString } from '../utils/helper';
import { forEach, getConfig, getTime, objectKeys, pushItem } from '../utils/variables';

type AnyMethod = Method<any, any, any, any, any, any, any>;
// 响应数据缓存
let responseCache: Record<string, Record<string, [data: any, method: AnyMethod, expireTime: number]>> = {};

/**
 * 检查给定时间是否过期，如果没有过期时间则表示数据永不过期，否则需要判断是否过期
 * @param expireTime 过期时间
 * @returns 是否过期
 */
const isExpired = (expireTime: number) => expireTime < getTime();

/**
 * @description 获取Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @returns 缓存的响应数据，如果没有则返回undefined
 */
export const getResponseCache = (namespace: string, key: string) => {
	const cachedResponse = responseCache[namespace];
	if (!cachedResponse) {
		return;
	}
	const cachedItem = cachedResponse[key];
	if (cachedItem) {
		if (!isExpired(cachedItem[2])) {
			return cachedItem[0];
		}
		// 如果过期，则删除缓存
		delete cachedResponse[key];
	}
};

/**
 * @description 设置Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @param data 缓存数据
 * @param methodInstance method实例
 * @param expireTimestamp 过期时间戳，单位毫秒
 */
export const setResponseCache = (
	namespace: string,
	key: string,
	data: any,
	methodInstance: AnyMethod,
	expireTimestamp = 0
) => {
	// 小于0则不缓存了
	if (expireTimestamp > 0 && data) {
		const cachedResponse = (responseCache[namespace] = responseCache[namespace] || {});
		cachedResponse[key] = [data, methodInstance, expireTimestamp];
	}
};

/**
 * @description 清除Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 */
export const removeResponseCache = (namespace: string, key: string) => {
	const cachedResponse = responseCache[namespace];
	if (cachedResponse) {
		delete cachedResponse[key];
	}
};

/**
 * @description 清空Response缓存数据
 */
export const clearResponseCache = () => {
	responseCache = {};
};

/** 过滤出所有符合条件的项 */
export const keyFilter = 'filter';

/** 过滤出符合条件的第一项 */
export const keyFind = 'find';

/**
 * 获取Method实例快照，它将根据matcher来筛选出对应的Method实例
 * @param 匹配的快照名称，可以是字符串或正则表达式、或带过滤函数的对象
 * @returns 匹配到的Method实例快照数组
 */
export const getMethodSnapshot = <F extends 'filter' | 'find'>(filter: MethodFilter, filterFn: F) => {
	// 将filter参数统一解构为nameMatcher和filterHandler
	let namespace = '';
	let nameMatcher: string | RegExp = '';
	let filterHandler: MethodFilterHandler | undefined;
	if (isString(filter) || instanceOf(filter, RegExp)) {
		nameMatcher = filter;
	} else if (isPlainObject(filter)) {
		nameMatcher = filter.name;
		filterHandler = filter.filter;
		const alova = filter.alova;
		namespace = alova ? alova.id : namespace;
	}

	// 通过解构的nameMatcher和filterHandler，获取对应的Method实例快照
	const matches = [] as AnyMethod[];

	// 如果有提供namespace参数则只在这个namespace中查找，否则在所有缓存数据中查找
	forEach(objectKeys(responseCache), keyedNamespace => {
		if (!namespace || keyedNamespace === namespace) {
			const cachedResponse = responseCache[keyedNamespace];
			forEach(objectKeys(cachedResponse), methodKey => {
				// 为做到和缓存表现统一，如果过期了则不匹配出来，并删除其缓存
				const [_, hitedMethodInstance, expireTime] = cachedResponse[methodKey];
				if (isExpired(expireTime)) {
					delete cachedResponse[methodKey];
					return;
				}
				const name = getConfig(hitedMethodInstance).name || '';
				if (instanceOf(nameMatcher, RegExp) ? nameMatcher.test(name) : name === nameMatcher) {
					pushItem(matches, hitedMethodInstance);
				}
			});
		}
	});

	return (
		filterHandler ? matches[filterFn](filterHandler) : filterFn === keyFind ? matches[0] : matches
	) as F extends 'filter' ? AnyMethod[] : AnyMethod;
};
