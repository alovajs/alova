// rollup.config.js
// commonjs
const config = require('./rollup.ts/index.js');
const replace = require('@rollup/plugin-replace');
const paths = config.compilePath;
const moduleType = 'common';

module.exports = {
  input: paths.input,
  output: {
    name: paths.packageName,
    file: paths.output(moduleType, 'cjs'),
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
    }),
    replace({
      'process.env.MODULE': JSON.stringify(moduleType),
      preventAssignment: true
    })
  ]
};
