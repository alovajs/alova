import { AlovaGlobalConfig } from '~/typings';

export let globalConfigMap: Required<AlovaGlobalConfig> = {
  methodSnapshots: 1000,
  autoInvalidateCache: 'global'
};

/**
 * 设置全局配置
 * @param config
 */
export default (config: AlovaGlobalConfig) => {
  globalConfigMap = {
    ...globalConfigMap,
    ...config
  };
};
