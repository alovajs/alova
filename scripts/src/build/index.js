#!/usr/bin/env node
import ora from 'ora';
import createConfig from './tsdown.config.js';
// tsdown 为纯 ESM 包，运行时经 pnpm 软链可正常解析；eslint 的 import 解析器无法识别，故在此禁用该规则
// eslint-disable-next-line import/no-unresolved
import { build as buildWithTsdown } from 'tsdown';
import { resolve } from 'node:path';
import { readFileSync, readdirSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';

const basePath = process.cwd();

/**
 * @typedef {Object} BuildOptions
 * @property {string} packageName - The name of the package.
 * @property {string} input - The input file path.
 * @property {string} output - The output file path.
 * @property {Object<string, string|null>} external - A record of external dependencies.
 * @property {('esm' | 'cjs' | 'umd')[]} [formats]
 * @property {boolean} [withDTS] - Whether to generate a .d.ts file.
 * @property {string} [dtsOutput] - The dts file. If not specify, use the output option.
 */

/**
 * 调用 tsdown 构建单个配置，并（在需要时）将 d.ts 产物移动到目标路径。
 * @param {{ config: import('tsdown').UserConfig, dts?: { tmpDir: string, target: string } }} item
 */
async function buildOne(item) {
  const { config, dts } = item;
  const label = dts ? dts.target : `${config.outDir}/${config.outputOptions.entryFileNames}`;
  const spinner = ora(`Building \`${label}\`...`).start();
  try {
    await buildWithTsdown(config);
    spinner.succeed(`[${config.name}] \`${label}\` built`);
  } catch (error) {
    spinner.fail(`[${config.name}] \`${label}\` failed`);
    throw error;
  }

  // d.ts 产物先输出到临时目录，这里移动到最终目标路径
  if (dts) {
    const files = readdirSync(dts.tmpDir);
    const jsRe = /\.(cjs|mjs|js)$/;
    const nonJs = files.filter(f => !jsRe.test(f));
    const decl = nonJs.find(f => /\.d\.(ts|mts)$/.test(f)) || nonJs[0];
    if (!decl) {
      throw new Error(`Declaration file not found in ${dts.tmpDir}`);
    }
    const targetAbs = resolve(basePath, dts.target);
    mkdirSync(resolve(targetAbs, '..'), { recursive: true });
    copyFileSync(resolve(dts.tmpDir, decl), targetAbs);
    rmSync(dts.tmpDir, { recursive: true, force: true });
  }
}

export default async function build(bundleKey, version) {
  // if only pass the version param, then bundleKey is the version value.
  if (/^[0-9]+\.[0-9]+\.[0-9]+$/.test(bundleKey) && !version) {
    version = bundleKey;
    bundleKey = undefined;
  }

  const bundles = JSON.parse(readFileSync(resolve(basePath, './build.json'), { encoding: 'utf-8' }));
  /** @type{BuildOptions[]} */
  const bundleConfigList = [];
  if (!bundleKey) {
    // it indicates that only a single bundle config.
    if (bundles.input && bundles.output) {
      bundleConfigList.push(bundles);
    } else {
      // otherwise build all bundles.
      bundleConfigList.push(...Object.values(bundles));
    }
  } else {
    bundleConfigList.push(bundles[bundleKey]);
  }

  let buildFailed = false;
  try {
    for (const bundleConfig of bundleConfigList) {
      const configs = createConfig(bundleConfig, version);
      for (const item of configs) {
        await buildOne(item);
      }
    }
  } catch (error) {
    buildFailed = true;
    // do some error reporting
    // eslint-disable-next-line no-console
    console.error(error);
  }
  process.exit(buildFailed ? 1 : 0);
}
