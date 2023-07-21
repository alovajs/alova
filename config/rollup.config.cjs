// rollup.config.js
// commonjs
const config = require('./rollup.cjs');
const module = process.argv.pop().replace('--', '') || 'core';
const paths = config.compilePath;
const moduleType = 'cjs';

module.exports = {
  input: paths.input,
  output: {
    name: paths.packageName,
    file: paths.output(moduleType),
    format: 'cjs',
    // When export and export default are not used at the same time, set legacy to true.
    // legacy: true,
    banner: config.banner
  },
  external: config.external,
  plugins: [
    config.getCompiler({
      tsconfigOverride: {
        compilerOptions: {
          declaration: true,
          module: 'ES2015'
        }
      },
      useTsconfigDeclarationDir: true
    })
  ]
};
