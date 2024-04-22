export const /** 三种缓存模式 */
  // 只在内存中缓存，默认是此选项
  MEMORY = 'memory',
  // 缓存会持久化，但当内存中没有缓存时，持久化缓存只会作为响应数据的占位符，且还会发送请求更新缓存

  STORAGE_PLACEHOLDER = 'placeholder',
  // 缓存会持久化，且每次刷新会读取持久化缓存到内存中，这意味着内存一直会有缓存
  STORAGE_RESTORE = 'restore';
