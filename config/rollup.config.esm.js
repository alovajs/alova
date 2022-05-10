/*
 * @Date: 2020-04-09 11:06:01
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2022-05-10 21:34:27
 */
// rollup.config.js
// ES output
var pkg = require('../package.json');
var common = require('./rollup.js');

module.exports = {
    input: 'src/index.ts',
    output: {
        file: 'dist/' + pkg.name + '.esm.js',
        format: 'es',
        // When export and export default are not used at the same time, set legacy to true.
        // legacy: true,
        banner: common.banner,
    },
    external: common.external,
    plugins: [
        common.getCompiler()
    ]
};
