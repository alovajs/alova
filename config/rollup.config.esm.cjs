// rollup.config.js
// ES output
const config = require('./rollup.cjs');
const paths = config.compilePath;
const moduleType = 'esm';

module.exports = {
  input: paths.input,
  output: {
    name: paths.packageName,
    file: paths.output(moduleType),
    format: 'es',
    // When export and export default are not used at the same time, set legacy to true.
    // legacy: true,
    banner: config.banner
  },
  external: config.external,
  plugins: [config.getCompiler()]
};
