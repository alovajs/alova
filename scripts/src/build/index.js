#!/usr/bin/env node
const { rollup } = require('rollup');
const createConfig = require('./rollup.config.js');
const ora = require('ora');

module.exports = async function (bundleKey, version) {
  let bundle;
  let buildFailed = false;
  const rollupConfigurations = createConfig(bundleKey, version);
  try {
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
  } catch (error) {
    buildFailed = true;
    // do some error reporting
    console.error(error);
  }
  if (bundle) {
    // closes the bundle
    await bundle.close();
  }
  process.exit(buildFailed ? 1 : 0);
};
