import { resolve } from 'node:path';
import type { ViteUserConfig } from 'vitest/config';

export default <ViteUserConfig['test']>{
  alias: {
    '~': process.cwd(),
    '#': resolve(process.cwd(), 'test'),
    root: resolve(__dirname, 'internal'),
    '@': resolve(process.cwd(), 'src')
  },
  environment: 'jsdom',
  setupFiles: [resolve(__dirname, 'internal/jest.setup.ts')],
  globals: true
};
