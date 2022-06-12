/*
 * @Date: 2020-04-09 11:06:01
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2022-06-12 22:27:44
 */
// rollup.config.js
// ES output
var config = require('./rollup.js');
var paths = config.compilePath;
var moduleType = 'esm';

module.exports = {
    input: paths.input,
    output: {
        file: paths.output(moduleType),
        format: 'es',
        // When export and export default are not used at the same time, set legacy to true.
        // legacy: true,
        banner: config.banner,
    },
    external: config.external,
    plugins: [
        config.getCompiler()
    ]
};
