// hook通用配置
export interface UseHookConfig {
  force?: boolean,   // 强制请求
};

// useRequest配置类型
export interface RequestHookConfig extends UseHookConfig {
  immediate?: boolean,   // 开启immediate后，useRequest会立即发起一次请求
}

// useWatcher配置类型
export interface WatcherHookConfig extends UseHookConfig {
  immediate?: boolean,  // 开启immediate后，useWatcher初始化时会自动发起一次请求
  debounce?: number, // 延迟多少毫秒后再发起请求
}