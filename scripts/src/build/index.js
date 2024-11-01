#!/usr/bin/env node
const { rollup } = require('rollup');
const ora = require('ora');
const createConfig = require('./rollup.config.js');
const { resolve } = require('node:path');

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
 * @typedef {Object} MergedRollupBuildOptions
 * @property {string} [name] - The name of the build.
 * @property {import('rollup').InputOptions} inputOptions - The name of the package.
 * @property {import('rollup').OutputOptions[]} outputOptionsList - The input file path.
 */

/**
 * @param {BuildOptions} bundleConfig
 * @param {string} version
 * @param {(bundleConfig: BuildOptions, version: string) => MergedRollupBuildOptions[]} configFn
 */
const rollupPackage = async (bundleConfig, version, configFn) => {
  const rollupConfigurations = configFn(bundleConfig, version);
  for (const { name, inputOptions, outputOptionsList } of rollupConfigurations) {
    const files = outputOptionsList.map(({ file }) => file).join(', ');
    const spinner = ora(`Building \`${files}\`...`).start();
    const bundle = await rollup(inputOptions);
    for (const outputOptions of outputOptionsList) {
      // generate output specific code in-memory
      // you can call this function multiple times on the same bundle object
      // replace bundle.generate with bundle.write to directly write to disk
      await bundle.write(outputOptions);
    }
    if (bundle) {
      await bundle.close();
    }
    spinner.succeed(`[${name}] \`${files}\` built`);
  }
};

const basePath = process.cwd();
module.exports = async function build(bundleKey, version) {
  // if only pass the version param, then bundleKey is the version value.
  if (/^[0-9]+\.[0-9]+\.[0-9]+$/.test(bundleKey) && !version) {
    version = bundleKey;
    bundleKey = undefined;
  }

  // eslint-disable-next-line
  const bundles = require(resolve(basePath, './build.json'));
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
      await rollupPackage(bundleConfig, version, createConfig);
    }
  } catch (error) {
    buildFailed = true;
    // do some error reporting
    // eslint-disable-next-line no-console
    console.error(error);
  }
  process.exit(buildFailed ? 1 : 0);
};
