import { AlovaGlobalConfig } from '~/typings';

export let globalConfigMap: Required<AlovaGlobalConfig> = {
  autoHitCache: 'global'
};

/**
 * Set global configuration
 * @param config
 */
export default (config: AlovaGlobalConfig) => {
  globalConfigMap = {
    ...globalConfigMap,
    ...config
  };
};
