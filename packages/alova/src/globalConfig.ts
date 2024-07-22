import { AlovaGlobalConfig } from '~/typings';

export let globalConfigMap: Required<AlovaGlobalConfig> = {
<<<<<<< HEAD:src/globalConfig.ts
  limitSnapshots: 1000
};

/**
 * 设置全局配置
=======
  autoHitCache: 'global'
};

/**
 * Set global configuration
>>>>>>> next:packages/alova/src/globalConfig.ts
 * @param config
 */
export default (config: AlovaGlobalConfig) => {
  globalConfigMap = {
    ...globalConfigMap,
    ...config
  };
};
