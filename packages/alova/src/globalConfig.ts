import { defaultIsSSR } from '@alova/shared/vars';
import { AlovaGlobalConfig } from '~/typings';

export let globalConfigMap: Required<AlovaGlobalConfig> = {
  autoHitCache: 'global',
  ssr: defaultIsSSR
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
