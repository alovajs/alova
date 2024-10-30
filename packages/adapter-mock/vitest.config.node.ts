import { defineProject, mergeConfig } from 'vitest/config';
import vitestConfigBase from '../../vitest.config.base';

export default mergeConfig(
  vitestConfigBase,
  defineProject({
    test: {
      name: '[Server]@alova/mock',
      environment: 'node'
    }
  })
);
