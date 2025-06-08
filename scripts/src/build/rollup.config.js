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
const repository = pkg.repository.url.replace('.git', '');

/** @typedef {'cjs' | 'esm' | 'umd'} BuildFormat target format */
/**
 * @typedef {Object} BuildOptions
 * @property {import('rollup').ModuleFormat} format
 * @property {string} file
 * @property {boolean} [prod]
 */

/** @type {BuildFormat[]} */
const defaultBuildFormats = ['cjs', 'esm', 'umd'];

/**
 * input build config, and generate corresponding rollup config
 * @param {import('./index').BuildOptions} bundleConfig config in build.json
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
    let newOutputPattern = `${outputPattern}`;
    if (!suffix) {
      newOutputPattern = newOutputPattern.replace('.{suffix}', '');
    }
    return newOutputPattern.replace('{suffix}', suffix).replace('{ext}', ext);
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
  * ${pkg.name} ${version || pkg.version} (${pkg.homepage})
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
      let externalPackages = [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        ...['path', 'url', 'stream'],
        ...treeShakenDeps
      ];
      // when key `external` is null, the umd format file doesn't as an external dep
      if (!env) {
        // if env is empty, add all external to externals in build.json
        externalPackages.push(...Object.keys(globalPackages));
      } else {
        // otherwise only add key `external` whose value is not null
        Object.keys(globalPackages).forEach(key => {
          const value = globalPackages[key];
          if (value) {
            externalPackages.push(key);
          } else if (isBrowser) {
            // remove current package from externalPackages
            externalPackages = externalPackages.filter(item => item !== key);
          }
        });
      }

      return externalPackages;
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
            compilerOptions: { module: 'es2015' },
            skipLibCheck: true
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

  const rollupConfigs = outputOptionsArray.map(config =>
    config.prod ? createProdConfig(config) : createDevConfig(config)
  );

  if (rollupConfigs.length && bundleConfig.withDTS) {
    rollupConfigs.push(createDTSConfig(outputConfigs.esm[0]));
  }

  return rollupConfigs;
};
