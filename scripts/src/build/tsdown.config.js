// tsdown 配置生成器：将 `build.json` 中的 bundle 描述转换为 tsdown 的构建配置数组。
// 与旧的 rolldown/rollup 构建保持一致的输出文件名、格式、external、banner、globals 等行为。
import { readFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';

const basePath = process.cwd();
const pkgPath = resolve(basePath, './package.json');
const pkg = JSON.parse(readFileSync(pkgPath, { encoding: 'utf-8' }).toString());
const { author } = pkg;
const repository = pkg.repository.url.replace('.git', '');

const defaultBuildFormats = ['cjs', 'esm', 'umd'];

/**
 * @typedef {'cjs' | 'esm' | 'umd'} BuildFormat
 */

/**
 * 根据 output 模板与 suffix/ext 解析出具体输出路径。
 * @param {string} outputPattern
 * @param {string} suffix
 * @param {string} ext
 */
function resolveOutputPattern(outputPattern, suffix, ext) {
  let p = outputPattern;
  if (!suffix) {
    p = p.replace('.{suffix}', '');
  }
  return p.replace('{suffix}', suffix).replace('{ext}', ext);
}

/**
 * 从 output 模板推导出产物 basename（即去掉 `.{suffix}` 之前的部分的文件名）。
 * 例如 `dist/alova.{suffix}.{ext}` -> `alova`，`../alova/dist/clienthook/index.{suffix}.{ext}` -> `index`。
 * @param {string} outputPattern
 */
function getBaseName(outputPattern) {
  const idx = outputPattern.indexOf('.{suffix}');
  const head = idx === -1 ? outputPattern : outputPattern.slice(0, idx);
  return basename(head);
}

/**
 * @param {import('./index').BuildOptions} bundleConfig
 * @param {string} version
 * @returns {Array<{ config: import('tsdown').UserConfig, dts?: { tmpDir: string, target: string } }>}
 */
export default function createTsdownConfig(bundleConfig, version) {
  const buildName = bundleConfig.packageName;
  const entryFile = bundleConfig.input;
  const outputPattern = bundleConfig.output;
  const globalPackages = bundleConfig.external ?? {};
  const baseName = getBaseName(outputPattern);

  /** @param {{suffix:string, ext:string}} o */
  function resolveOutput(o) {
    return resolveOutputPattern(outputPattern, o.suffix, o.ext);
  }

  /** @type {Record<BuildFormat, {format:string, suffix:string, ext:string, prod?:boolean}[]>} */
  const outputConfigs = {
    cjs: [{ format: 'cjs', suffix: 'common', ext: 'cjs' }],
    esm: [{ format: 'esm', suffix: 'esm', ext: 'js' }],
    umd: [
      { format: 'umd', suffix: 'umd', ext: 'js' },
      { format: 'umd', suffix: 'umd.min', ext: 'js', prod: true }
    ]
  };

  /**
   * @param {{format:string, suffix:string, ext:string, prod?:boolean}} output
   */
  function createConfig(output) {
    const { format, suffix, ext, prod } = output;
    const isBrowser = format === 'umd';
    const isProdBuild = !!prod;
    const env = isProdBuild ? 'production' : isBrowser ? 'development' : undefined;

    const banner = `/**
  * ${pkg.name} ${version || pkg.version} (${pkg.homepage})
  * Document ${pkg.homepage}
  * Copyright ${new Date().getFullYear()} ${author}. All Rights Reserved
  * Licensed under MIT (${repository}/blob/main/LICENSE)
*/
`;

    /** @type {string[]} */
    let externalPackages = [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
      ...['path', 'url', 'stream']
    ];
    if (!env) {
      // 非浏览器产物：external 中声明的所有依赖均保持外部化
      externalPackages.push(...Object.keys(globalPackages));
    } else {
      // 浏览器（umd）产物：仅 external 中值为真（全局名）的依赖外部化，
      // 值为 null 的依赖需被打包进 bundle（与旧 rolldown 行为一致）。
      Object.keys(globalPackages).forEach(key => {
        const value = globalPackages[key];
        if (value) {
          externalPackages.push(key);
        } else if (isBrowser) {
          externalPackages = externalPackages.filter(item => item !== key);
        }
      });
    }

    // umd 全局名映射：仅保留 external 中值不为 null 的依赖
    const globals = Object.fromEntries(Object.entries(globalPackages).filter(([, value]) => value != null));

    // tsdown 默认会把 package.json 中的 dependencies/peerDependencies 自动外部化，
    // 而浏览器（umd）构建中 external 值为 null 的依赖需要被打进 bundle。
    // 这里用 alwaysBundle 强制打包这些依赖，覆盖 tsdown 的默认自动外部化行为。
    const alwaysBundle = isBrowser ? Object.keys(globalPackages).filter(key => !globalPackages[key]) : [];

    const resolvedOutput = resolveOutput({ suffix, ext });
    const outDir = dirname(resolvedOutput);
    const entryFileNames = basename(resolvedOutput);

    /** @type {import('tsdown').UserConfig} */
    const config = {
      name: `${format}${prod ? '.min' : ''}`,
      cwd: basePath,
      entry: { [baseName]: entryFile },
      format: [format],
      outDir,
      outputOptions: {
        entryFileNames,
        globals
      },
      globalName: isBrowser ? buildName : undefined,
      banner,
      // 通过 deps.neverBundle 显式控制外部依赖，避免 tsdown 的默认自动外部化干扰
      deps: {
        neverBundle: externalPackages,
        alwaysBundle
      },
      dts: false,
      clean: false, // 同一目录多格式产物时由调用方在构建前清理
      target: false // 不做语法降级，保持与旧 rolldown 构建一致的输出
    };
    if (env) {
      config.define = { 'process.env.NODE_ENV': JSON.stringify(env) };
    }
    if (isProdBuild) {
      config.minify = true;
    }
    return config;
  }

  /**
   * 生成 d.ts 构建配置。tsdown 的 d.ts 产物文件名无法与 JS 产物完全解耦，
   * 因此先输出到临时目录，再由调用方移动到 `dtsOutput` 指定的目标路径。
   */
  function createDTSConfig() {
    const tmpDir = resolve(basePath, `.tsdown-dts-${baseName}`);
    /** @type {import('tsdown').UserConfig} */
    const config = {
      name: 'dts',
      cwd: basePath,
      entry: { [baseName]: entryFile },
      format: ['esm'],
      outDir: tmpDir,
      outputOptions: {
        entryFileNames: `${baseName}.js`
      },
      dts: true,
      clean: true,
      target: false
    };
    return config;
  }

  const buildFormats = bundleConfig.formats ?? defaultBuildFormats;
  const outputOptionsArray = buildFormats.map(f => outputConfigs[f]).flat();

  /** @type {Array<{ config: import('tsdown').UserConfig, dts?: { tmpDir: string, target: string } }>} */
  const configs = outputOptionsArray.map(output => ({ config: createConfig(output) }));

  if (bundleConfig.withDTS) {
    const dtsConfig = createDTSConfig();
    const dtsTarget = bundleConfig.dtsOutput ?? resolveOutput({ suffix: '', ext: 'd.ts' });
    configs.push({
      config: dtsConfig,
      dts: { tmpDir: dtsConfig.outDir, target: dtsTarget }
    });
  }

  return configs;
}
