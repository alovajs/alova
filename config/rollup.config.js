/*
 * @Date: 2020-04-09 11:06:01
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2022-05-26 21:53:24
 */
// rollup.config.js
// commonjs
var pkg = require('../package.json');
var common = require('./rollup.js');

module.exports = {
    input: 'src/index.ts',
    output: {
        file: 'dist/' + pkg.name + '.js',
        format: 'cjs',
        // When export and export default are not used at the same time, set legacy to true.
        // legacy: true,
        banner: common.banner,
    },
    external: common.external,
    plugins: [
        common.getCompiler({
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
