/**
  * alova 2.19.1 (https://alova.js.org)
  * Document https://alova.js.org
  * Copyright 2024 Scott Hu. All Rights Reserved
  * Licensed under MIT (https://httpshub.com/alovajs/alova/blob/main/LICENSE)
  */

const undefStr = 'undefined';
// 以下为减少编译代码量而添加的统一处理函数或变量
const PromiseCls = Promise, promiseResolve = (value) => PromiseCls.resolve(value), promiseReject = (value) => PromiseCls.reject(value), ObjectCls = Object, undefinedValue = undefined, nullValue = null, trueValue = true, falseValue = false, promiseThen = (promise, onFulfilled, onrejected) => promise.then(onFulfilled, onrejected), promiseCatch = (promise, onrejected) => promise.catch(onrejected), promiseFinally = (promise, onfinally) => promise.finally(onfinally), JSONStringify = (value) => JSON.stringify(value), JSONParse = (value) => JSON.parse(value), setTimeoutFn = (fn, delay = 0) => setTimeout(fn, delay), clearTimeoutTimer = (timer) => clearTimeout(timer), objectKeys = (obj) => ObjectCls.keys(obj), forEach = (ary, fn) => ary.forEach(fn), pushItem = (ary, ...item) => ary.push(...item), mapItem = (ary, callbackfn) => ary.map(callbackfn), filterItem = (ary, predicate) => ary.filter(predicate), len = (data) => data.length, isArray = (arg) => Array.isArray(arg), deleteAttr = (arg, attr) => delete arg[attr], typeOf = (arg) => typeof arg, 
/** 三种缓存模式 */
// 只在内存中缓存，默认是此选项
MEMORY = 'memory', 
// 缓存会持久化，但当内存中没有缓存时，持久化缓存只会作为响应数据的占位符，且还会发送请求更新缓存
STORAGE_PLACEHOLDER = 'placeholder', 
// 缓存会持久化，且每次刷新会读取持久化缓存到内存中，这意味着内存一直会有缓存
STORAGE_RESTORE = 'restore', noBrowserWin = typeof window === undefStr || !window.location, 
// 是否为服务端运行，为了兼容浏览器以及非web客户端环境（如小程序），需要再判断一下process
isSSR = noBrowserWin && typeof process !== undefStr;

const titleStyle = 'color: black; font-size: 12px; font-weight: bolder';
/**
 * 默认cacheLogger函数
 */
var defaultCacheLogger = (response, methodInstance, cacheMode, tag) => {
    const cole = console, log = (...args) => console.log(...args), url = methodInstance.url, isRestoreMode = cacheMode === STORAGE_RESTORE, hdStyle = '\x1B[42m%s\x1B[49m', labelStyle = '\x1B[32m%s\x1B[39m', startSep = ` [HitCache]${url} `, endSepFn = () => Array(len(startSep) + 1).join('^');
    if (isSSR) {
        log(hdStyle, startSep);
        log(labelStyle, ' Cache ', response);
        log(labelStyle, ' Mode  ', cacheMode);
        isRestoreMode && log(labelStyle, ' Tag   ', tag);
        log(labelStyle, endSepFn());
    }
    else {
        cole.groupCollapsed
            ? cole.groupCollapsed('%cHitCache', 'padding: 2px 6px; background: #c4fcd3; color: #53b56d;', url)
            : log(hdStyle, startSep);
        log('%c[Cache]', titleStyle, response);
        log('%c[Mode]', titleStyle, cacheMode);
        isRestoreMode && log('%c[Tag]', titleStyle, tag);
        log('%c[Method]', titleStyle, methodInstance);
        cole.groupEnd ? cole.groupEnd() : log(labelStyle, endSepFn());
    }
};

let globalConfigMap = {
    limitSnapshots: 1000
};
/**
 * 设置全局配置
 * @param config
 */
var globalConfig = (config) => {
    globalConfigMap = {
        ...globalConfigMap,
        ...config
    };
};

/**
 * 构建错误信息
 * @param msg 错误信息
 * @returns 构建后的错误信息
 */
const buildErrorMsg = (msg) => `[alova]${msg}`;
/**
 * 创建一个Alova错误对象
 * @param msg 错误消息
 * @returns 错误对象
 */
var alovaError = (msg, code) => {
    const err = newInstance(Error, buildErrorMsg(msg));
    code && (err.name = code);
    return err;
};

/**
 * 自定义断言函数，表达式为false时抛出错误
 * @param expression 判断表达式，true或false
 * @param msg 断言消息
 */
function myAssert(expression, msg) {
    if (!expression) {
        throw alovaError(msg);
    }
}
/**
 * 断言是否匹配到method实例
 * @param methodInstance method实例
 */
const assertMethodMatcher = (methodInstance) => myAssert(!!methodInstance, "didn't match any method instance");

/**
 * 空函数，做兼容处理
 */
const noop = () => { }, 
/**
 * 返回参数自身的函数，做兼容处理用
 * 由于部分系统将self作为了保留字，故使用_self来区分
 * @param arg 任意参数
 * @returns 返回参数本身
 */
_self = (arg) => arg, 
/**
 * 判断参数是否为函数
 * @param fn 任意参数
 * @returns 该参数是否为函数
 */
isFn = (arg) => typeOf(arg) === 'function', 
/**
 * 判断参数是否为数字
 * @param arg 任意参数
 * @returns 该参数是否为数字
 */
isNumber = (arg) => typeOf(arg) === 'number' && !isNaN(arg), 
/**
 * 判断参数是否为字符串
 * @param arg 任意参数
 * @returns 该参数是否为字符串
 */
isString = (arg) => typeOf(arg) === 'string', 
/**
 * 全局的toString
 * @param arg 任意参数
 * @returns 字符串化的参数
 */
globalToString = (arg) => ObjectCls.prototype.toString.call(arg), 
/**
 * 判断是否为普通对象
 * @param arg 任意参数
 * @returns 判断结果
 */
isPlainObject = (arg) => globalToString(arg) === '[object Object]', 
/**
 * 判断是否为某个类的实例
 * @param arg 任意参数
 * @returns 判断结果
 */
instanceOf = (arg, cls) => arg instanceof cls, 
/**
 * 统一的时间戳获取函数
 * @returns 时间戳
 */
getTime = (date) => (date ? date.getTime() : Date.now()), 
/**
 * 通过method实例获取alova实例
 * @returns alova实例
 */
getContext = (methodInstance) => methodInstance.context, 
/**
 * 获取method实例配置数据
 * @returns 配置对象
 */
getConfig = (methodInstance) => methodInstance.config, 
/**
 * 获取alova配置数据
 * @returns alova配置对象
 */
getContextOptions = (alovaInstance) => alovaInstance.options, 
/**
 * 通过method实例获取alova配置数据
 * @returns alova配置对象
 */
getOptions = (methodInstance) => getContextOptions(getContext(methodInstance)), 
/**
 * 获取alova实例的statesHook
 * @returns statesHook对象
 */
getStatesHook = (alovaInstance) => getContextOptions(alovaInstance).statesHook, 
/**
 * 获取method实例的key值
 * @param methodInstance method实例
 * @returns {string} 此method实例的key值
 */
getMethodInternalKey = (methodInstance) => methodInstance.__key__, 
/**
 * 是否为特殊数据
 * @param data 提交数据
 * @returns 判断结果
 */
isSpecialRequestBody = (data) => {
    const dataTypeString = globalToString(data);
    return (/^\[object (Blob|FormData|ReadableStream|URLSearchParams)\]$/i.test(dataTypeString) ||
        instanceOf(data, ArrayBuffer));
}, 
/**
 * 获取请求方式的key值
 * @returns {string} 此请求方式的key值
 */
key = (methodInstance) => {
    const { params, headers } = getConfig(methodInstance);
    return JSONStringify([methodInstance.type, methodInstance.url, params, methodInstance.data, headers]);
}, objAssign = (target, ...sources) => {
    return ObjectCls.assign(target, ...sources);
}, 
/**
 * 创建防抖函数，当delay为0时立即触发函数
 * 场景：在调用useWatcher并设置了immediate为true时，首次调用需立即执行，否则会造成延迟调用
 * @param {GeneralFn} fn 回调函数
 * @param {number|(...args: any[]) => number} delay 延迟描述，设置为函数时可实现动态的延迟
 * @returns 延迟后的回调函数
 */
debounce = (fn, delay) => {
    let timer = nullValue;
    return function (...args) {
        const bindFn = fn.bind(this, ...args), delayMill = isNumber(delay) ? delay : delay(...args);
        timer && clearTimeoutTimer(timer);
        if (delayMill > 0) {
            timer = setTimeoutFn(bindFn, delayMill);
        }
        else {
            bindFn();
        }
    };
}, 
/**
 * 获取缓存的配置参数，固定返回{ e: number, m: number, s: boolean, t: string }格式的对象
 * e为expire缩写，表示缓存失效时间点（时间戳），单位为毫秒
 * m为mode缩写，存储模式
 * s为storage缩写，是否存储到本地
 * t为tag缩写，持久化存储标签
 * @param localCache 本地缓存参数
 * @returns 统一的缓存参数对象
 */
getLocalCacheConfigParam = (methodInstance) => {
    const _localCache = getConfig(methodInstance).localCache, getCacheExpireTs = (_localCache) => isNumber(_localCache) ? getTime() + _localCache : getTime(_localCache || undefinedValue);
    let cacheMode = MEMORY, expire = 0, storage = falseValue, tag = undefinedValue;
    if (!isFn(_localCache)) {
        if (isNumber(_localCache) || instanceOf(_localCache, Date)) {
            expire = getCacheExpireTs(_localCache);
        }
        else {
            const { mode = MEMORY, expire: configExpire = 0, tag: configTag } = _localCache || {};
            cacheMode = mode;
            expire = getCacheExpireTs(configExpire);
            storage = [STORAGE_PLACEHOLDER, STORAGE_RESTORE].includes(mode);
            tag = configTag ? configTag.toString() : undefinedValue;
        }
    }
    return {
        e: expire,
        m: cacheMode,
        s: storage,
        t: tag
    };
}, 
/**
 * 获取请求方法对象
 * @param methodHandler 请求方法句柄
 * @param args 方法调用参数
 * @returns 请求方法对象
 */
getHandlerMethod = (methodHandler, args = []) => {
    const methodInstance = isFn(methodHandler) ? methodHandler(...args) : methodHandler;
    myAssert(instanceOf(methodInstance, Method), 'hook handler must be a method instance or a function that returns method instance');
    return methodInstance;
}, 
/**
 * 统一配置
 * @param 数据
 * @returns 统一的配置
 */
sloughConfig = (config, args = []) => isFn(config) ? config(...args) : config, sloughFunction = (arg, defaultFn) => isFn(arg) ? arg : ![falseValue, nullValue].includes(arg) ? defaultFn : noop, 
/**
 * 创建类实例
 * @param cls 构造函数
 * @param args 构造函数参数
 * @returns 类实例
 */
newInstance = (cls, ...args) => new cls(...args), 
/**
 * 导出fetchStates map
 * @param frontStates front states map
 * @returns fetchStates map
 */
exportFetchStates = (frontStates) => ({
    fetching: frontStates.loading,
    error: frontStates.error,
    downloading: frontStates.downloading,
    uploading: frontStates.uploading
}), promiseStatesHook = (functionName = '') => {
    myAssert(!!boundStatesHook, `can not call ${functionName} until set the \`statesHook\` at alova instance`);
    return boundStatesHook;
};

/** method实例快照集合，发送过请求的method实例将会被保存 */
const methodSnapshots = {};
let snapshotCount = 0;
/**
 * 保存method实例快照
 * @param namespace 命名空间
 * @param methodInstance method实例
 */
const saveMethodSnapshot = (namespace, key, methodInstance) => {
    if (snapshotCount < globalConfigMap.limitSnapshots) {
        const namespacedSnapshots = (methodSnapshots[namespace] = methodSnapshots[namespace] || {});
        namespacedSnapshots[key] = methodInstance;
        snapshotCount++;
    }
};
/**
 * 获取Method实例快照，它将根据matcher来筛选出对应的Method实例
 * @param matcher 匹配的快照名称，可以是字符串或正则表达式、或带过滤函数的对象
 * @returns 匹配到的Method实例快照数组
 */
const matchSnapshotMethod = (matcher, matchAll = trueValue) => {
    // 将filter参数统一解构为nameMatcher和matchHandler
    let namespace = '', nameMatcher = undefinedValue, matchHandler;
    if (isString(matcher) || instanceOf(matcher, RegExp)) {
        nameMatcher = matcher;
    }
    else if (isPlainObject(matcher)) {
        nameMatcher = matcher.name;
        matchHandler = matcher.filter;
        const alova = matcher.alova;
        namespace = alova ? alova.id : namespace;
    }
    // 通过解构的nameMatcher和filterHandler，获取对应的Method实例快照
    const matches = [];
    // 如果有提供namespace参数则只在这个namespace中查找，否则在所有缓存数据中查找
    forEach(objectKeys(methodSnapshots), keyedNamespace => {
        if (!namespace || keyedNamespace === namespace) {
            const namespacedSnapshots = methodSnapshots[keyedNamespace];
            forEach(objectKeys(namespacedSnapshots), methodKey => {
                // 为做到和缓存表现统一，如果过期了则不匹配出来，并删除其缓存
                const hitMethodInstance = namespacedSnapshots[methodKey], name = getConfig(hitMethodInstance).name || '';
                // 当nameMatcher为undefined时，表示命中所有method实例
                if (nameMatcher === undefinedValue ||
                    (instanceOf(nameMatcher, RegExp) ? nameMatcher.test(name) : name === nameMatcher)) {
                    // 在外部需要使用原始的key，而不是实时生成key
                    pushItem(matches, hitMethodInstance);
                }
            });
        }
    });
    return (matchHandler ? matches[matchAll ? 'filter' : 'find'](matchHandler) : matchAll ? matches : matches[0]);
};
/**
 *
 * @param matcher Method实例匹配器
 * @param matchAll 是否匹配全部method实例
 * @returns
 */
const filterSnapshotMethods = (matcher, matchAll) => {
    let methods;
    if (isArray(matcher)) {
        methods = matcher;
    }
    else if (matcher && isString(matcher.url)) {
        methods = matchAll ? [matcher] : matcher;
    }
    else {
        methods = matchSnapshotMethod(matcher, matchAll);
    }
    return methods;
};

// 响应数据缓存
let responseCache = {};
/**
 * @description 获取Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @returns 缓存的响应数据，如果没有则返回undefined
 */
const getResponseCache = (namespace, key) => {
    const cachedResponse = responseCache[namespace];
    if (cachedResponse) {
        const cachedItem = cachedResponse[key];
        if (cachedItem) {
            if (cachedItem[1] > getTime()) {
                return cachedItem[0];
            }
            // 如果过期，则删除缓存
            deleteAttr(cachedResponse, key);
        }
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
const setResponseCache = (namespace, key, data, expireTimestamp = 0) => {
    if (expireTimestamp > getTime() && data) {
        const cachedResponse = (responseCache[namespace] = responseCache[namespace] || {});
        cachedResponse[key] = [data, expireTimestamp];
    }
};
/**
 * @description 清除Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 */
const removeResponseCache = (namespace, key) => {
    const cachedResponse = responseCache[namespace];
    cachedResponse && deleteAttr(cachedResponse, key);
};
/**
 * @description 清空Response缓存数据
 */
const clearResponseCache = () => {
    responseCache = {};
};

const responseStorageKeyPrefix = 'alova.';
const buildNamespacedStorageKey = (namespace, key) => responseStorageKeyPrefix + namespace + key;
const storageNameMethodKey = responseStorageKeyPrefix + 'resp.keys';
const updateAllResponseStorageKeys = (completedKey, operateCode, storage) => {
    const allKeys = storage.get(storageNameMethodKey) || [], index = allKeys.indexOf(completedKey);
    if (operateCode === 0 && index >= 0) {
        allKeys.splice(index, 1);
    }
    else if (operateCode === 1 && index < 0) {
        pushItem(allKeys, completedKey);
    }
    storage.set(storageNameMethodKey, allKeys);
};
/**
 * 持久化响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param response 存储的响应内容
 * @param expireTimestamp 过期时间点的时间戳表示
 * @param storage 存储对象
 * @param tag 存储标签，用于区分不同的存储标记
 */
const persistResponse = (namespace, key, response, expireTimestamp, storage, tag = nullValue) => {
    // 小于0则不持久化了
    if (expireTimestamp > 0 && response) {
        const methodStoreKey = buildNamespacedStorageKey(namespace, key);
        storage.set(methodStoreKey, [response, expireTimestamp === Infinity ? nullValue : expireTimestamp, tag]);
        updateAllResponseStorageKeys(methodStoreKey, 1, storage);
    }
};
/**
 * 获取存储的响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param storage 存储对象
 * @param tag 存储标签，标记改变了数据将会失效
 */
const getPersistentRawData = (namespace, key, storage, tag = null) => {
    const storagedData = storage.get(buildNamespacedStorageKey(namespace, key));
    if (storagedData) {
        const [_, expireTimestamp, storedTag = nullValue] = storagedData;
        // 如果没有过期时间则表示数据永不过期，否则需要判断是否过期
        if (storedTag === tag && (!expireTimestamp || expireTimestamp > getTime())) {
            return storagedData;
        }
        // 如果过期，则删除缓存
        removePersistentResponse(namespace, key, storage);
    }
};
/**
 * 获取存储的响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param storage 存储对象
 * @param tag 存储标签，标记改变了数据将会失效
 */
const getPersistentResponse = (namespace, key, storage, tag = null) => {
    const rawData = getPersistentRawData(namespace, key, storage, tag);
    return rawData ? rawData[0] : undefinedValue;
};
/**
 * 删除存储的响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param storage 存储对象
 */
const removePersistentResponse = (namespace, key, storage) => {
    const methodStoreKey = buildNamespacedStorageKey(namespace, key);
    storage.remove(methodStoreKey);
    updateAllResponseStorageKeys(methodStoreKey, 0, storage);
};
/**
 * 清空所有存储的响应数据
 */
const clearPersistentResponse = () => {
    forEach(usingStorageAdapters, storage => {
        const allKeys = storage.get(storageNameMethodKey) || [];
        forEach(allKeys, keyItem => {
            storage.remove(keyItem);
        });
        storage.remove(storageNameMethodKey);
    });
};

var cloneMethod = (methodInstance) => {
    const { data, config } = methodInstance, newConfig = { ...config }, { headers = {}, params = {} } = newConfig, ctx = getContext(methodInstance);
    newConfig.headers = { ...headers };
    newConfig.params = { ...params };
    const newMethod = newInstance((Method), methodInstance.type, ctx, methodInstance.url, newConfig, data);
    return objAssign(newMethod, {
        ...methodInstance,
        config: newConfig
    });
};

/*
 * 以下三个函数中的matcher为Method实例匹配器，它分为3种情况：
 * 1. 如果matcher为Method实例，则清空该Method实例缓存
 * 2. 如果matcher为字符串或正则，则清空所有符合条件的Method实例缓存
 * 3. 如果未传入matcher，则会清空所有缓存
 */
/**
 * 查询缓存
 * @param matcher Method实例匹配器
 * @returns 缓存数据，未查到时返回undefined
 */
const queryCache = (matcher) => {
    const methodInstance = filterSnapshotMethods(matcher, falseValue);
    if (methodInstance) {
        const { id, storage } = getContext(methodInstance), methodKey = getMethodInternalKey(methodInstance);
        return (getResponseCache(id, methodKey) ||
            getPersistentResponse(id, methodKey, storage, getLocalCacheConfigParam(methodInstance).t));
    }
};
/**
 * 手动设置缓存响应数据，如果对应的methodInstance设置了持久化存储，则还会去检出持久化存储中的缓存
 * @param matcher Method实例匹配器
 * @param data 缓存数据
 */
const setCache = (matcher, dataOrUpdater) => {
    const methodInstances = filterSnapshotMethods(matcher, trueValue);
    forEach(methodInstances, methodInstance => {
        const { id, storage } = getContext(methodInstance), methodKey = getMethodInternalKey(methodInstance), { e: expireMilliseconds, s: toStorage, t: tag } = getLocalCacheConfigParam(methodInstance);
        let data = dataOrUpdater;
        if (isFn(dataOrUpdater)) {
            const cachedData = getResponseCache(id, methodKey) || getPersistentResponse(id, methodKey, storage, tag);
            data = dataOrUpdater(cachedData);
            if (data === undefinedValue) {
                return;
            }
        }
        setResponseCache(id, methodKey, data, expireMilliseconds);
        toStorage && persistResponse(id, methodKey, data, expireMilliseconds, storage, tag);
    });
};
/**
 * 失效缓存
 * @param matcher Method实例匹配器
 */
const invalidateCache = (matcher) => {
    if (!matcher) {
        clearResponseCache();
        clearPersistentResponse();
        return;
    }
    const methodInstances = filterSnapshotMethods(matcher, trueValue);
    forEach(methodInstances, methodInstance => {
        const { id, storage } = getContext(methodInstance), methodKey = getMethodInternalKey(methodInstance);
        removeResponseCache(id, methodKey);
        removePersistentResponse(id, methodKey, storage);
    });
};

const adapterReturnMap = {};
/**
 * 构建完整的url
 * @param base baseURL
 * @param url 路径
 * @param params url参数
 * @returns 完整的url
 */
const buildCompletedURL = (baseURL, url, params) => {
    // baseURL如果以/结尾，则去掉/
    baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    // 如果不是/或http协议开头的，则需要添加/
    url = url.match(/^(\/|https?:\/\/)/) ? url : `/${url}`;
    const completeURL = baseURL + url;
    // 将params对象转换为get字符串
    // 过滤掉值为undefined的
    const paramsStr = mapItem(filterItem(objectKeys(params), key => params[key] !== undefinedValue), key => `${key}=${params[key]}`).join('&');
    // 将get参数拼接到url后面，注意url可能已存在参数
    return paramsStr
        ? +completeURL.includes('?')
            ? `${completeURL}&${paramsStr}`
            : `${completeURL}?${paramsStr}`
        : completeURL;
};
/**
 * 实际的请求函数
 * @param method 请求方法对象
 * @param forceRequest 忽略缓存
 * @returns 响应数据
 */
function sendRequest(methodInstance, forceRequest) {
    let fromCache = trueValue, requestAdapterCtrlsPromiseResolveFn;
    const requestAdapterCtrlsPromise = newInstance(PromiseCls, resolve => {
        requestAdapterCtrlsPromiseResolveFn = resolve;
    }), response = async () => {
        const { beforeRequest = noop, responsed, responded, requestAdapter, cacheLogger } = getOptions(methodInstance), 
        // 使用克隆的methodKey，防止用户使用克隆的method实例再次发起请求，导致key重复
        clonedMethod = cloneMethod(methodInstance), methodKey = getMethodInternalKey(clonedMethod), { e: expireMilliseconds, s: toStorage, t: tag, m: cacheMode } = getLocalCacheConfigParam(methodInstance), { id, storage } = getContext(methodInstance), 
        // 获取受控缓存或非受控缓存
        { localCache } = getConfig(methodInstance);
        // 如果当前method设置了受控缓存，则看是否有自定义的数据
        let cachedResponse = isFn(localCache)
            ? await localCache()
            : // 如果是强制请求的，则跳过从缓存中获取的步骤
                // 否则判断是否使用缓存数据
                forceRequest
                    ? undefinedValue
                    : getResponseCache(id, methodKey);
        // 如果是STORAGE_RESTORE模式，且缓存没有数据时，则需要将持久化数据恢复到缓存中，过期时间要使用缓存的
        if (cacheMode === STORAGE_RESTORE && !cachedResponse) {
            const rawPersistentData = getPersistentRawData(id, methodKey, storage, tag);
            if (rawPersistentData) {
                const [persistentResponse, persistentExpireMilliseconds] = rawPersistentData;
                setResponseCache(id, methodKey, persistentResponse, persistentExpireMilliseconds);
                cachedResponse = persistentResponse;
            }
        }
        // 发送请求前调用钩子函数
        // beforeRequest支持同步函数和异步函数
        await beforeRequest(clonedMethod);
        const { baseURL, url: newUrl, type, data } = clonedMethod, { params = {}, headers = {}, transformData = _self, name: methodInstanceName = '', shareRequest } = getConfig(clonedMethod), namespacedAdapterReturnMap = (adapterReturnMap[id] = adapterReturnMap[id] || {}), 
        // responsed是一个错误的单词，正确的单词是responded
        // 在2.1.0+添加了responded的支持，并和responsed做了兼容处理
        // 计划将在3.0中正式使用responded
        responseUnified = responded || responsed;
        let requestAdapterCtrls = namespacedAdapterReturnMap[methodKey], responseSuccessHandler = _self, responseErrorHandler = undefinedValue, responseCompleteHandler = noop;
        if (isFn(responseUnified)) {
            responseSuccessHandler = responseUnified;
        }
        else if (isPlainObject(responseUnified)) {
            const { onSuccess: successHandler, onError: errorHandler, onComplete: completeHandler } = responseUnified;
            responseSuccessHandler = isFn(successHandler) ? successHandler : responseSuccessHandler;
            responseErrorHandler = isFn(errorHandler) ? errorHandler : responseErrorHandler;
            responseCompleteHandler = isFn(completeHandler) ? completeHandler : responseCompleteHandler;
        }
        // 如果没有缓存则发起请求
        if (cachedResponse !== undefinedValue) {
            requestAdapterCtrlsPromiseResolveFn(); // 遇到缓存将不传入ctrls
            // 打印缓存日志
            sloughFunction(cacheLogger, defaultCacheLogger)(cachedResponse, clonedMethod, cacheMode, tag);
            responseCompleteHandler(clonedMethod);
            return cachedResponse;
        }
        fromCache = falseValue;
        if (!shareRequest || !requestAdapterCtrls) {
            // 请求数据
            const ctrls = requestAdapter({
                url: buildCompletedURL(baseURL, newUrl, params),
                type,
                data,
                headers
            }, clonedMethod);
            requestAdapterCtrls = namespacedAdapterReturnMap[methodKey] = ctrls;
        }
        // 将requestAdapterCtrls传到promise中供onDownload、onUpload及abort中使用
        requestAdapterCtrlsPromiseResolveFn(requestAdapterCtrls);
        /**
         * 处理响应任务，失败时不缓存数据
         * @param responsePromise 响应promise实例
         * @param headers 请求头
         * @param callInSuccess 是否在成功回调中调用
         * @returns 处理后的response
         */
        const handleResponseTask = async (handlerReturns, headers, callInSuccess = trueValue) => {
            const data = await handlerReturns, transformedData = await transformData(data, headers || {});
            saveMethodSnapshot(id, methodKey, methodInstance);
            // 当requestBody为特殊数据时不保存缓存
            // 原因1：特殊数据一般是提交特殊数据，需要和服务端交互
            // 原因2：特殊数据不便于生成缓存key
            const requestBody = clonedMethod.data, toCache = !requestBody || !isSpecialRequestBody(requestBody);
            if (toCache && callInSuccess) {
                setResponseCache(id, methodKey, transformedData, expireMilliseconds);
                toStorage && persistResponse(id, methodKey, transformedData, expireMilliseconds, storage, tag);
            }
            // 查找hitTarget，让它的缓存失效
            const hitMethods = matchSnapshotMethod({
                filter: cachedMethod => (cachedMethod.hitSource || []).some(sourceMatcher => instanceOf(sourceMatcher, RegExp)
                    ? sourceMatcher.test(methodInstanceName)
                    : sourceMatcher === methodInstanceName || sourceMatcher === methodKey)
            });
            len(hitMethods) > 0 && invalidateCache(hitMethods);
            return transformedData;
        };
        return promiseFinally(promiseThen(PromiseCls.all([requestAdapterCtrls.response(), requestAdapterCtrls.headers()]), ([rawResponse, headers]) => {
            // 无论请求成功、失败，都需要首先移除共享的请求
            deleteAttr(namespacedAdapterReturnMap, methodKey);
            return handleResponseTask(responseSuccessHandler(rawResponse, clonedMethod), headers);
        }, (error) => {
            // 无论请求成功、失败，都需要首先移除共享的请求
            deleteAttr(namespacedAdapterReturnMap, methodKey);
            return isFn(responseErrorHandler)
                ? // 响应错误时，如果未抛出错误也将会处理响应成功的流程，但不缓存数据
                    handleResponseTask(responseErrorHandler(error, clonedMethod), undefinedValue, falseValue)
                : promiseReject(error);
        }), () => {
            responseCompleteHandler(clonedMethod);
        });
    };
    return {
        // 请求中断函数
        abort: () => {
            promiseThen(requestAdapterCtrlsPromise, requestAdapterCtrls => requestAdapterCtrls && requestAdapterCtrls.abort());
        },
        onDownload: (handler) => {
            promiseThen(requestAdapterCtrlsPromise, requestAdapterCtrls => requestAdapterCtrls && requestAdapterCtrls.onDownload && requestAdapterCtrls.onDownload(handler));
        },
        onUpload: (handler) => {
            promiseThen(requestAdapterCtrlsPromise, requestAdapterCtrls => requestAdapterCtrls && requestAdapterCtrls.onUpload && requestAdapterCtrls.onUpload(handler));
        },
        response,
        fromCache: () => fromCache
    };
}

const offEventCallback = (offHandler, handlers) => () => {
    const index = handlers.indexOf(offHandler);
    index >= 0 && handlers.splice(index, 1);
};
const typeGet = 'GET';
const typeHead = 'HEAD';
const typePost = 'POST';
const typePut = 'PUT';
const typePatch = 'PATCH';
const typeDelete = 'DELETE';
const typeOptions = 'OPTIONS';
const abortRequest = () => {
    abortRequest.a();
};
abortRequest.a = noop;
class Method {
    constructor(type, context, url, config, data) {
        this.dhs = [];
        this.uhs = [];
        /**
         * 请求中断函数，每次请求都会更新这个函数
         */
        this.abort = abortRequest;
        this.fromCache = undefinedValue;
        const instance = this, contextOptions = getContextOptions(context);
        instance.baseURL = contextOptions.baseURL || '';
        instance.url = url;
        instance.type = type;
        instance.context = context;
        // 将请求相关的全局配置合并到Method对象中
        const contextConcatConfig = {}, mergedLocalCacheKey = 'localCache', globalLocalCache = isPlainObject(contextOptions[mergedLocalCacheKey])
            ? contextOptions[mergedLocalCacheKey][type]
            : undefinedValue, hitSource = config && config.hitSource;
        // 合并参数
        forEach(['timeout', 'shareRequest'], mergedKey => {
            if (contextOptions[mergedKey] !== undefinedValue) {
                contextConcatConfig[mergedKey] = contextOptions[mergedKey];
            }
        });
        // 合并localCache
        if (globalLocalCache !== undefinedValue) {
            contextConcatConfig[mergedLocalCacheKey] = globalLocalCache;
        }
        // 将hitSource统一处理成数组，且当有method实例时将它们转换为methodKey
        if (hitSource) {
            instance.hitSource = mapItem(isArray(hitSource) ? hitSource : [hitSource], sourceItem => instanceOf(sourceItem, Method) ? getMethodInternalKey(sourceItem) : sourceItem);
            deleteAttr(config, 'hitSource');
        }
        instance.config = {
            ...contextConcatConfig,
            headers: {},
            params: {},
            ...(config || {})
        };
        instance.data = data;
        instance.meta = config && config.meta;
        // 在外部需要使用原始的key，而不是实时生成key
        // 原因是，method的参数可能传入引用类型值，但引用类型值在外部改变时，实时生成的key也随之改变，因此使用最开始的key更准确
        instance.__key__ = key(instance);
    }
    /**
     * 绑定下载进度回调函数
     * @param progressHandler 下载进度回调函数
     * @version 2.17.0
     * @return 解绑函数
     */
    onDownload(downloadHandler) {
        pushItem(this.dhs, downloadHandler);
        return offEventCallback(downloadHandler, this.dhs);
    }
    /**
     * 绑定上传进度回调函数
     * @param progressHandler 上传进度回调函数
     * @version 2.17.0
     * @return 解绑函数
     */
    onUpload(uploadHandler) {
        pushItem(this.uhs, uploadHandler);
        return offEventCallback(uploadHandler, this.uhs);
    }
    /**
     * 通过method实例发送请求，返回promise对象
     */
    send(forceRequest = falseValue) {
        const instance = this, { response, onDownload, onUpload, abort, fromCache } = sendRequest(instance, forceRequest);
        len(instance.dhs) > 0 &&
            onDownload((total, loaded) => forEach(instance.dhs, handler => handler({ total, loaded })));
        len(instance.uhs) > 0 && onUpload((total, loaded) => forEach(instance.uhs, handler => handler({ total, loaded })));
        // 每次请求时将中断函数绑定给method实例，使用者也可通过methodInstance.abort()来中断当前请求
        instance.abort.a = abort;
        instance.fromCache = undefinedValue;
        return promiseThen(response(), r => {
            instance.fromCache = fromCache();
            return r;
        });
    }
    /**
     * 设置方法名称，如果已有名称将被覆盖
     * @param name 方法名称
     */
    setName(name) {
        getConfig(this).name = name;
    }
    /**
     * 绑定resolve和/或reject Promise的callback
     * @param onfullified resolve Promise时要执行的回调
     * @param onrejected 当Promise被reject时要执行的回调
     * @returns 返回一个Promise，用于执行任何回调
     */
    then(onfulfilled, onrejected) {
        return promiseThen(this.send(), onfulfilled, onrejected);
    }
    /**
     * 绑定一个仅用于reject Promise的回调
     * @param onrejected 当Promise被reject时要执行的回调
     * @returns 返回一个完成回调的Promise
     */
    catch(onrejected) {
        return promiseCatch(this.send(), onrejected);
    }
    /**
     * 绑定一个回调，该回调在Promise结算（resolve或reject）时调用
     * @param onfinally Promise结算（resolve或reject）时执行的回调。
     * @return 返回一个完成回调的Promise。
     */
    finally(onfinally) {
        return promiseFinally(this.send(), onfinally);
    }
}

/**
 * 创建默认的localStorage存储适配器
 */
const session = {}, sessionStorage = {
    getItem: (key) => session[key],
    setItem: (key, value) => (session[key] = value),
    removeItem: (key) => deleteAttr(session, key)
}, 
// 设置为函数防止在初始化时报错
storage = () => (noBrowserWin ? sessionStorage : window.localStorage);
var globalLocalStorage = {
    set: (key, value) => storage().setItem(key, JSONStringify(value)),
    get: key => {
        const data = storage().getItem(key);
        return data ? JSONParse(data) : data;
    },
    remove: key => storage().removeItem(key)
};

const defaultAlovaOptions = {
    /**
     * GET请求默认缓存5分钟（300000毫秒），其他请求默认不缓存
     */
    localCache: {
        [typeGet]: 300000
    },
    /**
     * 共享请求默认为true
     */
    shareRequest: trueValue
};
let idCounter = 0;
class Alova {
    constructor(options) {
        this.id = ++idCounter + '';
        // 如果storage未指定，则默认使用localStorage
        this.storage = options.storageAdapter || globalLocalStorage;
        // 合并默认options
        this.options = {
            ...defaultAlovaOptions,
            ...options
        };
    }
    Get(url, config) {
        return newInstance((Method), typeGet, this, url, config);
    }
    Post(url, data = {}, config) {
        return newInstance((Method), typePost, this, url, config, data);
    }
    Delete(url, data = {}, config) {
        return newInstance((Method), typeDelete, this, url, config, data);
    }
    Put(url, data = {}, config) {
        return newInstance((Method), typePut, this, url, config, data);
    }
    Head(url, config) {
        return newInstance((Method), typeHead, this, url, config);
    }
    Patch(url, data = {}, config) {
        return newInstance((Method), typePatch, this, url, config, data);
    }
    Options(url, config) {
        return newInstance((Method), typeOptions, this, url, config);
    }
}
let boundStatesHook = undefinedValue;
const usingStorageAdapters = [];
/**
 * 创建Alova实例
 * @param options alova配置参数
 * @returns Alova实例
 */
const createAlova = (options) => {
    const alovaInstance = newInstance((Alova), options), newStatesHook = getStatesHook(alovaInstance);
    if (boundStatesHook) {
        myAssert(boundStatesHook === newStatesHook, 'must use the same `statesHook` in single project');
    }
    boundStatesHook = newStatesHook;
    const storageAdapter = alovaInstance.storage;
    !usingStorageAdapters.includes(storageAdapter) && pushItem(usingStorageAdapters, storageAdapter);
    return alovaInstance;
};

const stateCache = {};
/**
 * @description 获取State缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @returns 缓存的响应数据，如果没有则返回{}
 */
const getStateCache = (namespace, key) => {
    const cachedState = stateCache[namespace] || {};
    return cachedState[key] || {};
};
/**
 * @description 设置State缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @param data 缓存数据
 */
const setStateCache = (namespace, key, data, hookInstance) => {
    const cachedState = (stateCache[namespace] = stateCache[namespace] || {});
    cachedState[key] = {
        s: data,
        h: hookInstance
    };
};
/**
 * @description 清除State缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 */
const removeStateCache = (namespace, key) => {
    const cachedState = stateCache[namespace];
    if (cachedState) {
        deleteAttr(cachedState, key);
    }
};

/**
 * 更新对应method的状态
 * @param method 请求方法对象
 * @param handleUpdate 更新回调
 * @returns 是否更新成功，未找到对应的状态时不会更新成功
 */
function updateState(matcher, handleUpdate, options = {}) {
    const { onMatch = noop } = options, methodInstance = filterSnapshotMethods(matcher, falseValue);
    let updated = falseValue;
    // 只处理符合条件的第一个Method实例，如果没有符合条件的实例，则不处理
    if (methodInstance) {
        onMatch(methodInstance); // 触发onMatch事件
        const { dehydrate, update } = promiseStatesHook('updateState'), methodKey = getMethodInternalKey(methodInstance), { id, storage } = getContext(methodInstance), { s: frontStates, h: hookInstance } = getStateCache(id, methodKey), updateStateCollection = isFn(handleUpdate) ? { data: handleUpdate } : handleUpdate;
        let updatedDataColumnData = undefinedValue;
        if (frontStates) {
            // 循环遍历更新数据，并赋值给受监管的状态
            forEach(objectKeys(updateStateCollection), stateName => {
                myAssert(stateName in frontStates, `can not find state named \`${stateName}\``);
                myAssert(!objectKeys(frontStates).slice(-4).includes(stateName), 'can not update preset states');
                const updatedData = updateStateCollection[stateName](dehydrate(frontStates[stateName], stateName, hookInstance));
                // 记录data字段的更新值，用于更新缓存数据
                if (stateName === 'data') {
                    updatedDataColumnData = updatedData;
                }
                update({
                    [stateName]: updatedData
                }, frontStates, hookInstance);
            });
            updated = trueValue;
        }
        // 如果更新了data，则需要同时更新缓存和持久化数据
        if (updatedDataColumnData !== undefinedValue) {
            const { e: expireMilliseconds, s: toStorage, t: tag } = getLocalCacheConfigParam(methodInstance);
            setResponseCache(id, methodKey, updatedDataColumnData, expireMilliseconds);
            toStorage && persistResponse(id, methodKey, updatedDataColumnData, expireMilliseconds, storage, tag);
        }
    }
    return updated;
}

const createHook = (ht, c) => ({
    /** 最后一次请求的method实例 */
    m: undefinedValue,
    /** saveStatesFns */
    sf: [],
    /** removeStatesFns */
    rf: [],
    /** frontStates */
    fs: {},
    /** successHandlers */
    sh: [],
    /** errorHandlers */
    eh: [],
    /** completeHandlers */
    ch: [],
    /** hookType, useRequest=1, useWatcher=2, useFetcher=3 */
    ht,
    /** hook config */
    c,
    /** enableDownload */
    ed: falseValue,
    /** enableUpload */
    eu: falseValue
});

/**
 * 默认errorLogger函数
 */
var defaultErrorLogger = (error) => {
    console.error(error.message || error);
};

const defaultMiddleware = (_, next) => next();

/**
 * 创建统一的事件对象
 */
var createAlovaEvent = (eventType, method, sendArgs, fromCache, data, error, status) => {
    const allPropsEvent = {
        /** 事件对应的请求行为 */
        /** 当前的method实例 */
        method,
        /** 通过send触发请求时传入的参数 */
        sendArgs,
        /** 响应数据，只在成功时有值 */
        data,
        /** 失败时抛出的错误，只在失败时有值 */
        error,
        /** 请求状态 */
        status,
        /** data数据是否来自缓存，当status为error时，fromCache始终为false */
        fromCache
    };
    const eventInstance = {};
    forEach(objectKeys(allPropsEvent), key => {
        allPropsEvent[key] !== undefinedValue &&
            (eventInstance[key] = allPropsEvent[key]);
    });
    // 将此类的对象重新命名，让它看上去是由不同的类生成的对象
    // 以此来对应typescript中定义的类型
    const typeName = ['AlovaSuccessEvent', 'AlovaErrorEvent', 'AlovaCompleteEvent', 'AlovaEvent'][eventType];
    typeName &&
        ObjectCls.defineProperty(eventInstance, Symbol.toStringTag, {
            value: typeName
        });
    return eventInstance;
};

/**
 * 统一处理useRequest/useWatcher/useFetcher等请求钩子函数的请求逻辑
 * @param hookInstance hook实例
 * @param methodHandler 请求方法对象或获取函数
 * @param sendCallingArgs send函数参数
 * @returns 请求状态
 */
function useHookToSendRequest(hookInstance, methodHandler, sendCallingArgs = []) {
    let methodInstance = getHandlerMethod(methodHandler, sendCallingArgs);
    const { fs: frontStates, sh: successHandlers, eh: errorHandlers, ch: completeHandlers, ht, c: useHookConfig } = hookInstance, isFetcher = ht === 3 /* EnumHookType.USE_FETCHER */, { force: forceRequest = falseValue, middleware = defaultMiddleware } = useHookConfig, alovaInstance = getContext(methodInstance), { id, options: { errorLogger }, storage } = alovaInstance, { update } = promiseStatesHook(), 
    // 如果是静默请求，则请求后直接调用onSuccess，不触发onError，然后也不会更新progress
    methodKey = getMethodInternalKey(methodInstance), { m: cacheMode, t: tag } = getLocalCacheConfigParam(methodInstance), { sendable = () => trueValue, abortLast = trueValue } = useHookConfig;
    hookInstance.m = methodInstance;
    return (async () => {
        let sendableValue = falseValue;
        try {
            sendableValue = !!sendable(createAlovaEvent(3 /* AlovaEventType.AlovaEvent */, methodInstance, sendCallingArgs));
        }
        catch (error) { }
        if (!sendableValue) {
            update({ loading: falseValue }, frontStates, hookInstance);
            return;
        }
        // 初始化状态数据，在拉取数据时不需要加载，因为拉取数据不需要返回data数据
        let removeStates = noop, saveStates = noop, cachedResponse = getResponseCache(id, methodKey), isNextCalled = falseValue, responseHandlePromise = promiseResolve(undefinedValue), offDownloadEvent = noop, offUploadEvent = noop, fromCache = () => !!cachedResponse, 
        // 是否为受控的loading状态，当为true时，响应处理中将不再设置loading为false
        controlledLoading = falseValue;
        if (!isFetcher) {
            // 当缓存模式为memory时不获取缓存，减少缓存获取
            const persistentResponse = cacheMode !== MEMORY ? getPersistentResponse(id, methodKey, storage, tag) : undefinedValue;
            // 如果有持久化数据，则需要判断是否需要恢复它到缓存中
            cachedResponse =
                cacheMode === STORAGE_RESTORE && !cachedResponse && persistentResponse ? persistentResponse : cachedResponse;
            // 当缓存模式为placeholder时，先更新data再去发送请求
            if (cacheMode === STORAGE_PLACEHOLDER && persistentResponse) {
                update({
                    data: persistentResponse
                }, frontStates, hookInstance);
            }
            // 将初始状态存入缓存以便后续更新
            saveStates = (frontStates) => setStateCache(id, methodKey, frontStates, hookInstance);
            saveStates(frontStates);
            // 设置状态移除函数，将会传递给hook内的effectRequest，它将被设置在组件卸载时调用
            removeStates = () => removeStateCache(id, methodKey);
        }
        // 中间件函数next回调函数，允许修改强制请求参数，甚至替换即将发送请求的Method实例
        const guardNext = guardNextConfig => {
            isNextCalled = trueValue;
            const { force: guardNextForceRequest = forceRequest, method: guardNextReplacingMethod = methodInstance } = guardNextConfig || {}, forceRequestFinally = sloughConfig(guardNextForceRequest, sendCallingArgs), progressUpdater = (stage) => ({ loaded, total }) => update({
                [stage]: {
                    loaded,
                    total
                }
            }, frontStates, hookInstance);
            methodInstance = guardNextReplacingMethod;
            // 每次发送请求都需要保存最新的控制器
            pushItem(hookInstance.sf, saveStates);
            pushItem(hookInstance.rf, removeStates);
            // loading状态受控时将不更改loading
            // 未命中缓存，或强制请求时需要设置loading为true
            !controlledLoading && update({ loading: !!forceRequestFinally || !cachedResponse }, frontStates, hookInstance);
            const { ed: enableDownload, eu: enableUpload } = hookInstance;
            offDownloadEvent = enableDownload ? methodInstance.onDownload(progressUpdater('downloading')) : offDownloadEvent;
            offUploadEvent = enableUpload ? methodInstance.onUpload(progressUpdater('uploading')) : offUploadEvent;
            responseHandlePromise = methodInstance.send(forceRequestFinally);
            fromCache = () => methodInstance.fromCache || falseValue;
            return responseHandlePromise;
        };
        // 调用中间件函数
        let successHandlerDecorator, errorHandlerDecorator, completeHandlerDecorator = undefinedValue;
        const commonContext = {
            method: methodInstance,
            cachedResponse,
            config: useHookConfig,
            abort: () => methodInstance.abort(),
            decorateSuccess(decorator) {
                isFn(decorator) && (successHandlerDecorator = decorator);
            },
            decorateError(decorator) {
                isFn(decorator) && (errorHandlerDecorator = decorator);
            },
            decorateComplete(decorator) {
                isFn(decorator) && (completeHandlerDecorator = decorator);
            }
        }, runArgsHandler = (handlers, decorator, event) => {
            forEach(handlers, (handler, index) => isFn(decorator) ? decorator(handler, event, index, len(handlers)) : handler(event));
        }, 
        // 是否需要更新响应数据，以及调用响应回调
        toUpdateResponse = () => ht !== 2 /* EnumHookType.USE_WATCHER */ || !abortLast || hookInstance.m === methodInstance, fetchStates = exportFetchStates(frontStates), 
        // 调用中间件函数
        middlewareCompletePromise = isFetcher
            ? middleware({
                ...commonContext,
                fetchArgs: sendCallingArgs,
                fetch: (matcher, ...args) => {
                    const methodInstance = filterSnapshotMethods(matcher, falseValue);
                    assertMethodMatcher(methodInstance);
                    return useHookToSendRequest(hookInstance, methodInstance, args);
                },
                fetchStates,
                update: newFetchStates => update(newFetchStates, fetchStates, hookInstance),
                controlFetching(control = trueValue) {
                    controlledLoading = control;
                }
            }, guardNext)
            : middleware({
                ...commonContext,
                sendArgs: sendCallingArgs,
                send: (...args) => useHookToSendRequest(hookInstance, methodHandler, args),
                frontStates,
                update: newFrontStates => update(newFrontStates, frontStates, hookInstance),
                controlLoading(control = trueValue) {
                    controlledLoading = control;
                }
            }, guardNext);
        let finallyResponse = undefinedValue;
        try {
            // 统一处理响应
            const middlewareReturnedData = await middlewareCompletePromise;
            const afterSuccess = (data) => {
                // 更新缓存响应数据
                if (!isFetcher) {
                    toUpdateResponse() && update({ data }, frontStates, hookInstance);
                }
                else if (hookInstance.c.updateState !== falseValue) {
                    // 更新缓存内的状态，一般为useFetcher中进入
                    const cachedState = getStateCache(id, methodKey).s;
                    cachedState && update({ data }, cachedState, hookInstance);
                }
                // 如果需要更新响应数据，则在请求后触发对应回调函数
                if (toUpdateResponse()) {
                    const newStates = { error: undefinedValue };
                    // loading状态受控时将不再更改为false
                    !controlledLoading && (newStates.loading = falseValue);
                    update(newStates, frontStates, hookInstance);
                    runArgsHandler(successHandlers, successHandlerDecorator, createAlovaEvent(0 /* AlovaEventType.AlovaSuccessEvent */, methodInstance, sendCallingArgs, fromCache(), data));
                    runArgsHandler(completeHandlers, completeHandlerDecorator, createAlovaEvent(2 /* AlovaEventType.AlovaCompleteEvent */, methodInstance, sendCallingArgs, fromCache(), data, undefinedValue, 'success'));
                }
                return data;
            };
            finallyResponse =
                // 中间件中未返回数据或返回undefined时，去获取真实的响应数据
                // 否则使用返回数据并不再等待响应promise，此时也需要调用响应回调
                middlewareReturnedData !== undefinedValue
                    ? afterSuccess(middlewareReturnedData)
                    : isNextCalled
                        ? // 当middlewareCompletePromise为resolve时有两种可能
                            // 1. 请求正常
                            // 2. 请求错误，但错误被中间件函数捕获了，此时也将调用成功回调，即afterSuccess(undefinedValue)
                            await promiseThen(responseHandlePromise, afterSuccess, () => afterSuccess(undefinedValue))
                        : // 如果isNextCalled未被调用，则不返回数据
                            undefinedValue;
            // 未调用next函数时，更新loading为false
            !isNextCalled && !controlledLoading && update({ loading: falseValue }, frontStates, hookInstance);
        }
        catch (error) {
            if (toUpdateResponse()) {
                // 控制在输出错误消息
                sloughFunction(errorLogger, defaultErrorLogger)(error, methodInstance);
                const newStates = { error };
                // loading状态受控时将不再更改为false
                !controlledLoading && (newStates.loading = falseValue);
                update(newStates, frontStates, hookInstance);
                runArgsHandler(errorHandlers, errorHandlerDecorator, createAlovaEvent(1 /* AlovaEventType.AlovaErrorEvent */, methodInstance, sendCallingArgs, fromCache(), undefinedValue, error));
                runArgsHandler(completeHandlers, completeHandlerDecorator, createAlovaEvent(2 /* AlovaEventType.AlovaCompleteEvent */, methodInstance, sendCallingArgs, fromCache(), undefinedValue, error, 'error'));
            }
            throw error;
        }
        // 响应后解绑下载和上传事件
        offDownloadEvent();
        offUploadEvent();
        return finallyResponse;
    })();
}

const refCurrent = (ref) => ref.current;
/**
 * 创建请求状态，统一处理useRequest、useWatcher、useFetcher中一致的逻辑
 * 该函数会调用statesHook的创建函数来创建对应的请求状态
 * 当该值为空时，表示useFetcher进入的，此时不需要data状态和缓存状态
 * @param methodInstance 请求方法对象
 * @param useHookConfig hook请求配置对象
 * @param initialData 初始data数据
 * @param immediate 是否立即发起请求
 * @param watchingStates 被监听的状态，如果未传入，直接调用handleRequest
 * @param debounceDelay 请求发起的延迟时间
 * @returns 当前的请求状态、操作函数及事件绑定函数
 */
function createRequestState(hookType, methodHandler, useHookConfig, initialData, immediate = falseValue, watchingStates, debounceDelay = 0) {
    var _a;
    // 复制一份config，防止外部传入相同useHookConfig导致vue2情况下的状态更新错乱问题
    useHookConfig = { ...useHookConfig };
    const statesHook = promiseStatesHook('useHooks'), { create, export: stateExport, effectRequest, update, memorize = _self, ref = val => ({ current: val }) } = statesHook, middleware = useHookConfig.middleware;
    let initialLoading = middleware ? falseValue : !!immediate;
    // 当立即发送请求时，需要通过是否强制请求和是否有缓存来确定初始loading值，这样做有以下两个好处：
    // 1. 在react下立即发送请求可以少渲染一次
    // 2. SSR渲染的html中，其初始视图为loading状态的，避免在客户端展现时的loading视图闪动
    // 3. 如果config.middleware中设置了`controlLoading`时，需要默认为false，但这边无法确定middleware中是否有调用`controlLoading`，因此条件只能放宽点，当有`config.middleware`时则初始`loading`为false
    if (immediate && !middleware) {
        // 调用getHandlerMethod时可能会报错，需要try/catch
        try {
            const methodInstance = getHandlerMethod(methodHandler), alovaInstance = getContext(methodInstance), cachedResponse = getResponseCache(alovaInstance.id, getMethodInternalKey(methodInstance)), forceRequestFinally = sloughConfig((_a = useHookConfig.force) !== null && _a !== void 0 ? _a : falseValue);
            initialLoading = !!forceRequestFinally || !cachedResponse;
        }
        catch (error) { }
    }
    const hookInstance = refCurrent(ref(createHook(hookType, useHookConfig))), progress = {
        total: 0,
        loaded: 0
    }, 
    // 将外部传入的受监管的状态一同放到frontStates集合中
    { managedStates = {} } = useHookConfig, frontStates = {
        ...managedStates,
        data: create(initialData, hookInstance),
        loading: create(initialLoading, hookInstance),
        error: create(undefinedValue, hookInstance),
        downloading: create({ ...progress }, hookInstance),
        uploading: create({ ...progress }, hookInstance)
    }, hasWatchingStates = watchingStates !== undefinedValue, 
    // 初始化请求事件
    // 统一的发送请求函数
    handleRequest = (handler = methodHandler, sendCallingArgs) => useHookToSendRequest(hookInstance, handler, sendCallingArgs), 
    // 以捕获异常的方式调用handleRequest
    // 捕获异常避免异常继续向外抛出
    wrapEffectRequest = () => {
        promiseCatch(handleRequest(), noop);
    };
    /**
     * ## react ##每次执行函数都需要重置以下项
     **/
    hookInstance.fs = frontStates;
    hookInstance.sh = [];
    hookInstance.eh = [];
    hookInstance.ch = [];
    hookInstance.c = useHookConfig;
    // 在服务端渲染时不发送请求
    if (!isSSR) {
        effectRequest({
            handler: 
            // watchingStates为数组时表示监听状态（包含空数组），为undefined时表示不监听状态
            hasWatchingStates
                ? debounce(wrapEffectRequest, (changedIndex) => isNumber(changedIndex) ? (isArray(debounceDelay) ? debounceDelay[changedIndex] : debounceDelay) : 0)
                : wrapEffectRequest,
            removeStates: () => forEach(hookInstance.rf, fn => fn()),
            saveStates: (states) => forEach(hookInstance.sf, fn => fn(states)),
            frontStates: frontStates,
            watchingStates,
            immediate: immediate !== null && immediate !== void 0 ? immediate : trueValue
        }, hookInstance);
    }
    return {
        loading: stateExport(frontStates.loading, hookInstance),
        data: stateExport(frontStates.data, hookInstance),
        error: stateExport(frontStates.error, hookInstance),
        get downloading() {
            hookInstance.ed = trueValue;
            return stateExport(frontStates.downloading, hookInstance);
        },
        get uploading() {
            hookInstance.ed = trueValue;
            return stateExport(frontStates.uploading, hookInstance);
        },
        onSuccess(handler) {
            pushItem(hookInstance.sh, handler);
        },
        onError(handler) {
            pushItem(hookInstance.eh, handler);
        },
        onComplete(handler) {
            pushItem(hookInstance.ch, handler);
        },
        update: memorize((newStates) => {
            // 当useFetcher调用时，其fetching使用的是loading，更新时需要转换过来
            const { fetching } = newStates;
            if (fetching) {
                newStates.loading = fetching;
                deleteAttr(newStates, 'fetching');
            }
            update(newStates, frontStates, hookInstance);
        }),
        abort: memorize(() => hookInstance.m && hookInstance.m.abort()),
        /**
         * 通过执行该方法来手动发起请求
         * @param sendCallingArgs 调用send函数时传入的参数
         * @param methodInstance 方法对象
         * @param isFetcher 是否为isFetcher调用
         * @returns 请求promise
         */
        send: memorize((sendCallingArgs, methodInstance) => handleRequest(methodInstance, sendCallingArgs)),
        /** 为兼容options框架，如vue2、原生小程序等，将config对象原样导出 */
        _$c: useHookConfig
    };
}

/**
 * 获取请求数据并缓存
 * @param method 请求方法对象
 */
function useFetcher(config = {}) {
    const props = createRequestState(3 /* EnumHookType.USE_FETCHER */, noop, config);
    return {
        ...exportFetchStates(props),
        onSuccess: props.onSuccess,
        onError: props.onError,
        onComplete: props.onComplete,
        abort: props.abort,
        update: props.update,
        _$c: props._$c,
        /**
         * 拉取数据
         * fetch一定会发送请求，且如果当前请求的数据有管理对应的状态，则会更新这个状态
         * @param matcher Method对象匹配器
         */
        fetch: (matcher, ...args) => {
            const methodInstance = filterSnapshotMethods(matcher, falseValue);
            assertMethodMatcher(methodInstance);
            return props.send(args, methodInstance);
        }
    };
}

function useRequest(handler, config = {}) {
    const { immediate = trueValue, initialData } = config, props = createRequestState(1 /* EnumHookType.USE_REQUEST */, handler, config, initialData, !!immediate), send = props.send;
    return objAssign(props, {
        send: (...args) => send(args)
    });
}

function useWatcher(handler, watchingStates, config = {}) {
    myAssert(watchingStates && len(watchingStates) > 0, 'must specify at least one watching state');
    const { immediate, debounce = 0, initialData } = config, props = createRequestState(2 /* EnumHookType.USE_WATCHER */, handler, config, initialData, !!immediate, // !!immediate可以使immediate为falsy值时传入false，即不立即发送请求
    watchingStates, debounce), send = props.send;
    return objAssign(props, {
        send: (...args) => send(args)
    });
}

/* c8 ignore start */
if (process.env.NODE_ENV === 'development') {
    console.log(`powerful alova request strategies: https://alova.js.org/category/strategy
use mock data: https://alova.js.org/extension/alova-mock
please star alova if you like it: https://github.com/alovajs/alova
this tips will be removed in production environment`);
}
/* c8 ignore stop */

export { Method, createAlova, key as getMethodKey, globalConfig, invalidateCache, matchSnapshotMethod, queryCache, setCache, updateState, useFetcher, useRequest, useWatcher };
