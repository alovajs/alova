import { isSSR } from '@alova/shared';
import { AlovaGlobalConfig } from '~/typings';

export let globalConfigMap: Required<AlovaGlobalConfig> = {
  autoHitCache: 'global',
  ssr: isSSR
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
