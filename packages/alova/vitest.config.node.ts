import { defineProject, mergeConfig } from 'vitest/config';
import vitestConfigBase from '../../vitest.config.base';

Reflect.deleteProperty(vitestConfigBase.test || {}, 'include');
export default mergeConfig(
  vitestConfigBase,
  defineProject({
    test: {
      include: ['test/server/**/*.{test,spec}.ts'],
      environment: 'node'
    }
  })
);
