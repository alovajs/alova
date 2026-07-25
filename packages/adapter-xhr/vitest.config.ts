import { mergeConfig, defineProject } from 'vitest/config';
import vitestConfigBase from '../../vitest.config.base';

export default mergeConfig(vitestConfigBase, defineProject({}));
