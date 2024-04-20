#!/usr/bin/env node
const { rollup } = require('rollup');
const createConfig = require('./rollup.config.js');
const replace = require('@rollup/plugin-replace');
const ora = require('ora');

module.exports = async function (bundleKey) {
  let bundle;
  let buildFailed = false;
  const { inputOptions, outputOptionsList } = createConfig(bundleKey);
  try {
    // create a bundle
    const bundles = {};
    bundles.dev = await rollup({
      ...inputOptions,
      plugins: [
        ...inputOptions.plugins,
        replace({
          preventAssignment: true,
          'process.env.NODE_ENV': JSON.stringify('development')
        })
      ]
    });
    bundles.prod = await rollup({
      ...inputOptions,
      plugins: [
        ...inputOptions.plugins,
        replace({
          preventAssignment: true,
          'process.env.NODE_ENV': JSON.stringify('production')
        })
      ]
    });

    await generateOutputs(bundles, outputOptionsList);
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

async function generateOutputs(bundles, outputOptionsList) {
  for (const outputOptions of outputOptionsList) {
    const bundle = outputOptions.isProd ? bundles.prod : bundles.dev;
    delete outputOptions.isProd;
    const spinner = ora(`building ${outputOptions.file}...`);
    // generate output specific code in-memory
    // you can call this function multiple times on the same bundle object
    // replace bundle.generate with bundle.write to directly write to disk
    await bundle.write(outputOptions);
    spinner.succeed(`${outputOptions.file} built`);
  }
}
