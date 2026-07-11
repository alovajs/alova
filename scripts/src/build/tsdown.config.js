// tsdown config generator: converts the bundle descriptions in `build.json` into an array of tsdown build configs.
// Keeps output file names, formats, externals, banner, and globals consistent with the old rolldown/rollup builds.
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
 * Resolve the concrete output path from the output template and suffix/ext.
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
 * Derive the product basename from the output template (the filename before `.{suffix}`).
 * e.g. `dist/alova.{suffix}.{ext}` -> `alova`, `../alova/dist/clienthook/index.{suffix}.{ext}` -> `index`.
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
      // Non-browser output: keep all dependencies declared in external as external.
      externalPackages.push(...Object.keys(globalPackages));
    } else {
      // Browser (umd) output: only dependencies whose external value is truthy (a global name) are externalized,
      // those with a null value must be bundled in (consistent with the old rolldown behavior).
      Object.keys(globalPackages).forEach(key => {
        const value = globalPackages[key];
        if (value) {
          externalPackages.push(key);
        } else if (isBrowser) {
          externalPackages = externalPackages.filter(item => item !== key);
        }
      });
    }

    // umd global name mapping: keep only dependencies whose external value is not null.
    const globals = Object.fromEntries(Object.entries(globalPackages).filter(([, value]) => value != null));

    // tsdown auto-externalizes dependencies/peerDependencies from package.json by default,
    // while in browser (umd) builds dependencies with a null external value must be bundled in.
    // alwaysBundle forces these to be bundled, overriding tsdown's default auto-externalization.
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
      // Explicitly control external deps via deps.neverBundle to avoid tsdown's default auto-externalization interfering.
      deps: {
        neverBundle: externalPackages,
        alwaysBundle
      },
      dts: false,
      clean: false, // when multiple formats share the same dir, the caller clears it before building
      target: false // no syntax downgrading, keeping output consistent with the old rolldown builds
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
   * Generate the d.ts build config. tsdown cannot fully decouple the .d.ts output filename from the JS output,
   * so it is first written to a temp dir and then moved by the caller to the path specified by `dtsOutput`.
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
      // Do not set outputOptions.entryFileNames:
      // let rolldown-plugin-dts's createDtsInputPlugin decide the file name itself,
      // it names the dts chunk <name>.d.mts (under esm), while the JS chunk produced by this config
      // defaults to <name>.mjs, so the two do not conflict. Naming the dts chunk with a .d.mts
      // suffix is what triggers renderChunk to convert the var X=[...] intermediate representation back to real declarations.
      // If explicitly set to entryFileNames: '<name>.js', the dts chunk would be misnamed <name>.ts,
      // renderChunk would skip the conversion and leak var X=[...]; if set to '<name>.d.ts', the JS
      // chunk would steal that name and push the real dts to <name>2.d.ts, causing the wrong JS source to be selected when moving.
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
