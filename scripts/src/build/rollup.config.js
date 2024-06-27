const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { default: replace } = require('@rollup/plugin-replace');
const terser = require('@rollup/plugin-terser');
const typescript = require('@rollup/plugin-typescript');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { dts } = require('rollup-plugin-dts');
const alias = require('@rollup/plugin-alias').default;
const { entries } = require('./alias');

const basePath = process.cwd();
const pkgPath = resolve(basePath, './package.json');
const pkg = JSON.parse(readFileSync(pkgPath, { encoding: 'utf-8' }).toString());
const { author } = pkg;
const repository = pkg.repository.url.replace('git', 'https').replace('.git', '');

/** @typedef {'cjs' | 'esm' | 'umd'} BuildFormat 目标格式 */
/**
 * @typedef {Object} BuildOptions
 * @property {import('rollup').ModuleFormat} format
 * @property {string} file
 * @property {boolean} [prod]
 */

/** @type {BuildFormat[]} */
const defaultBuildFormats = ['cjs', 'esm', 'umd'];

/**
 * 输入 build 配置，生成对应的 rollup 配置
 * @param {import('./index').BuildOptions} bundleConfig build.json 中的编译字段
 * @param {string} version
 * @returns {import('.').MergedRollupBuildOptions[]}
 */
module.exports = function createRollupConfig(bundleConfig, version) {
  const buildName = bundleConfig.packageName;
  const entryFile = bundleConfig.input;
  const outputPattern = bundleConfig.output;
  const globalPackages = bundleConfig.external ?? {};

  /**
   * @param {object} options
   * @param {string} options.suffix
   * @param {string} options.ext
   */
  function resolveOutput({ suffix, ext }) {
    const newOutputPattern = `${outputPattern}`;
    return newOutputPattern.replace('{suffix}', suffix).replace('{ext}', ext).replace('..', '.');
  }

  /** @type {Record<BuildFormat, BuildOptions[]>} */
  const outputConfigs = {
    cjs: [
      {
        format: 'cjs',
        file: resolveOutput({ suffix: 'common', ext: 'cjs' })
      }
    ],
    esm: [
      {
        format: 'es',
        file: resolveOutput({ suffix: 'esm', ext: 'js' })
      }
    ],
    umd: [
      {
        format: 'umd',
        file: resolveOutput({ suffix: 'umd', ext: 'js' })
      },
      {
        format: 'umd',
        file: resolveOutput({ suffix: 'umd.min', ext: 'js' }),
        prod: true
      }
    ]
  };

  /**
   *
   * @param {BuildOptions} buildOptions
   * @param {import('rollup').Plugin[]} [plugins]
   * @returns {import('.').MergedRollupBuildOptions}
   */
  function createConfig(buildOptions, plugins = []) {
    const { format } = buildOptions;
    const isBrowser = format.includes('umd');
    const isProdBuild = format.includes('min');
    const env = isProdBuild ? 'production' : isBrowser ? 'development' : undefined;

    const banner = `/**
  * ${pkg.name} ${version} (${pkg.homepage})
  * Document ${pkg.homepage}
  * Copyright ${new Date().getFullYear()} ${author}. All Rights Reserved
  * Licensed under MIT (${repository}/blob/main/LICENSE)
*/
`;

    /**
     * @param {string[]} [treeShakenDeps]
     * @returns {string[]}
     */
    function resolveExternal(treeShakenDeps = []) {
      const externalPackages = [];
      // 当 external 的属性值设为 null 或 undefined 时，在 umd 中不会作为外部依赖

      if (!env) {
        // 如果 env 为空，则在 build.json中设置的 external 全部都添加到 externals 中
        externalPackages.push(...Object.keys(globalPackages));
      } else {
        // 否则，仅添加值不为 null 的包到 external 中
        Object.keys(globalPackages).forEach(key => {
          const value = globalPackages[key];
          if (value) {
            externalPackages.push(key);
          }
        });
      }

      return [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        ...['path', 'url', 'stream'],
        ...externalPackages,
        ...treeShakenDeps
      ];
    }

    function resolveReplacePlugin() {
      if (!env) {
        return [];
      }
      // only replace NODE_ENV when env be setted
      return [
        replace({
          preventAssignment: true,
          'process.env.NODE_ENV': env ? JSON.stringify(env) : undefined
        })
      ];
    }

    /**
     * @returns {import('rollup').OutputOptions[]}
     */
    function resolveOutput() {
      const { file, format } = buildOptions;
      /** @type{import('rollup').OutputOptions} */
      const outputForRollup = {
        name: buildName,
        file,
        format,
        banner,
        plugins,
        globals: globalPackages
      };

      return [outputForRollup];
    }

    return {
      name: buildOptions.format,
      inputOptions: {
        input: entryFile,
        external: resolveExternal(),
        plugins: [
          json(),
          nodeResolve({
            browser: true,
            extensions: ['.ts', '.js', 'tsx', 'jsx']
          }),
          commonjs(),
          typescript({
            include: ['src/**/*.ts', 'typings/**/*.d.ts'], // 不设置将默认会编译整个项目，导致报错
            compilerOptions: { module: 'es2015' }
          }),
          ...resolveReplacePlugin()
        ]
      },
      outputOptionsList: resolveOutput()
    };
  }

  /**
   * create rollup config for dev bundle
   * @param {BuildOptions} output
   * @returns {import('.').MergedRollupBuildOptions}
   */
  function createDevConfig(output) {
    return createConfig(output);
  }

  /**
   * create rollup config for prod bundle
   * @param {BuildOptions} output
   * @returns {import('.').MergedRollupBuildOptions}
   */
  function createProdConfig(output) {
    return createConfig(output, [terser({ module: output.format === 'esm' })]);
  }

  /**
   * create rollup config for d.ts file
   * @param {BuildOptions} output
   * @returns {import('.').MergedRollupBuildOptions}
   */
  function createDTSConfig(output) {
    const configForDTSGenerate = createConfig(output);

    configForDTSGenerate.inputOptions.plugins = [
      alias({
        entries
      }),
      dts({
        tsconfig: resolve('./tsconfig.json'),
        compilerOptions: {
          // fix: https://github.com/Swatinem/rollup-plugin-dts/issues/143
          preserveSymlinks: false
        }
      })
    ];
    const outputPath = bundleConfig.dtsOutput ?? resolveOutput({ suffix: '', ext: 'd.ts' });

    configForDTSGenerate.name = 'dts';
    configForDTSGenerate.outputOptionsList[0].file = outputPath;

    return configForDTSGenerate;
  }

  const buildFormats = bundleConfig.formats ?? defaultBuildFormats;
  const outputOptionsArray = buildFormats.map(format => outputConfigs[format]).flat();

  const rollupConfigs = outputOptionsArray.map(config => {
    if (config.prod) {
      return createProdConfig(config);
    }
    return createDevConfig(config);
  });

  if (rollupConfigs.length && bundleConfig.withDTS) {
    rollupConfigs.push(createDTSConfig(outputConfigs.esm[0]));
  }

  return rollupConfigs;
};
