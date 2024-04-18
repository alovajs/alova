import { AlovaGlobalConfig } from '~/typings';

export let globalConfigMap: Required<AlovaGlobalConfig> = {
  limitSnapshots: 1000
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
