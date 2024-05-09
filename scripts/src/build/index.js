#!/usr/bin/env node
const { rollup } = require('rollup');
const ora = require('ora');
const createConfig = require('./rollup.config.js');
const { resolve } = require('path');

const rollupPackage = async (bundleKey, version) => {
  const rollupConfigurations = createConfig(bundleKey, version);
  for (const { inputOptions, outputOptionsList } of rollupConfigurations) {
    const files = outputOptionsList.map(({ file }) => file).join(', ');
    const spinner = ora(`Building \`${files}\`...`);
    const bundle = await rollup(inputOptions);
    for (const outputOptions of outputOptionsList) {
      // generate output specific code in-memory
      // you can call this function multiple times on the same bundle object
      // replace bundle.generate with bundle.write to directly write to disk
      await bundle.write(outputOptions);
    }
    spinner.succeed(`\`${files}\` built`);
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
      await rollupPackage(bundleConfig, version);
    }
  } catch (error) {
    buildFailed = true;
    // do some error reporting
    // eslint-disable-next-line no-console
    console.error(error);
  }
  process.exit(buildFailed ? 1 : 0);
};
