
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const ALLUSERSPROFILE: string;
	export const APPCODE_VM_OPTIONS: string;
	export const APPDATA: string;
	export const CHROME_CRASHPAD_PIPE_NAME: string;
	export const CLASSPATH: string;
	export const CLION_VM_OPTIONS: string;
	export const COLORTERM: string;
	export const CommonProgramFiles: string;
	export const CommonProgramW6432: string;
	export const COMPUTERNAME: string;
	export const ComSpec: string;
	export const DATAGRIP_VM_OPTIONS: string;
	export const DATASPELL_VM_OPTIONS: string;
	export const DEVECOSTUDIO_VM_OPTIONS: string;
	export const DriverData: string;
	export const GATEWAY_VM_OPTIONS: string;
	export const GIT_ASKPASS: string;
	export const GOLAND_VM_OPTIONS: string;
	export const HOME: string;
	export const HOMEDRIVE: string;
	export const HOMEPATH: string;
	export const IDEA_VM_OPTIONS: string;
	export const INIT_CWD: string;
	export const JAVA_HOME: string;
	export const JETBRAINSCLIENT_VM_OPTIONS: string;
	export const JETBRAINS_CLIENT_VM_OPTIONS: string;
	export const LANG: string;
	export const LOCALAPPDATA: string;
	export const LOGONSERVER: string;
	export const NODE: string;
	export const NODE_ENV: string;
	export const npm_command: string;
	export const npm_config_engine_strict: string;
	export const npm_config_frozen_lockfile: string;
	export const npm_config_node_gyp: string;
	export const npm_config_registry: string;
	export const npm_config_resolution_mode: string;
	export const npm_config_strict_ssl: string;
	export const npm_config_user_agent: string;
	export const npm_execpath: string;
	export const npm_lifecycle_event: string;
	export const npm_lifecycle_script: string;
	export const npm_node_execpath: string;
	export const npm_package_dependencies_alova: string;
	export const npm_package_dependencies__alova_mock: string;
	export const npm_package_dependencies__alova_scene_svelte: string;
	export const npm_package_devDependencies_eslint: string;
	export const npm_package_devDependencies_eslint_config_prettier: string;
	export const npm_package_devDependencies_eslint_plugin_svelte: string;
	export const npm_package_devDependencies_prettier: string;
	export const npm_package_devDependencies_prettier_plugin_svelte: string;
	export const npm_package_devDependencies_svelte: string;
	export const npm_package_devDependencies_svelte_check: string;
	export const npm_package_devDependencies_tslib: string;
	export const npm_package_devDependencies_typescript: string;
	export const npm_package_devDependencies_vite: string;
	export const npm_package_devDependencies_vitest: string;
	export const npm_package_devDependencies__fontsource_fira_mono: string;
	export const npm_package_devDependencies__neoconfetti_svelte: string;
	export const npm_package_devDependencies__playwright_test: string;
	export const npm_package_devDependencies__sveltejs_adapter_auto: string;
	export const npm_package_devDependencies__sveltejs_kit: string;
	export const npm_package_devDependencies__typescript_eslint_eslint_plugin: string;
	export const npm_package_devDependencies__typescript_eslint_parser: string;
	export const npm_package_devDependencies__types_cookie: string;
	export const npm_package_name: string;
	export const npm_package_scripts_build: string;
	export const npm_package_scripts_check: string;
	export const npm_package_scripts_check_watch: string;
	export const npm_package_scripts_dev: string;
	export const npm_package_scripts_format: string;
	export const npm_package_scripts_lint: string;
	export const npm_package_scripts_preview: string;
	export const npm_package_scripts_test: string;
	export const npm_package_scripts_test_unit: string;
	export const npm_package_type: string;
	export const npm_package_version: string;
	export const NUMBER_OF_PROCESSORS: string;
	export const NVM_HOME: string;
	export const NVM_SYMLINK: string;
	export const ORIGINAL_XDG_CURRENT_DESKTOP: string;
	export const OS: string;
	export const Path: string;
	export const PATHEXT: string;
	export const PHPSTORM_VM_OPTIONS: string;
	export const PNPM_HOME: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const PROCESSOR_ARCHITECTURE: string;
	export const PROCESSOR_IDENTIFIER: string;
	export const PROCESSOR_LEVEL: string;
	export const PROCESSOR_REVISION: string;
	export const ProgramData: string;
	export const ProgramFiles: string;
	export const ProgramW6432: string;
	export const PROMPT: string;
	export const PSModulePath: string;
	export const PUBLIC: string;
	export const PYCHARM_VM_OPTIONS: string;
	export const RIDER_VM_OPTIONS: string;
	export const RUBYMINE_VM_OPTIONS: string;
	export const SESSIONNAME: string;
	export const STUDIO_VM_OPTIONS: string;
	export const SystemDrive: string;
	export const SystemRoot: string;
	export const TEMP: string;
	export const TERM_PROGRAM: string;
	export const TERM_PROGRAM_VERSION: string;
	export const TMP: string;
	export const TURBOCLIENTBIN: string;
	export const USERDOMAIN: string;
	export const USERDOMAIN_ROAMINGPROFILE: string;
	export const USERNAME: string;
	export const USERPROFILE: string;
	export const VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
	export const VSCODE_GIT_ASKPASS_MAIN: string;
	export const VSCODE_GIT_ASKPASS_NODE: string;
	export const VSCODE_GIT_IPC_HANDLE: string;
	export const VSCODE_INJECTION: string;
	export const WEBIDE_VM_OPTIONS: string;
	export const WEBSTORM_VM_OPTIONS: string;
	export const windir: string;
	export const ZES_ENABLE_SYSMAN: string;
}

/**
 * Similar to [`$env/static/private`](https://kit.svelte.dev/docs/modules#$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/master/packages/adapter-node) (or running [`vite preview`](https://kit.svelte.dev/docs/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		ALLUSERSPROFILE: string;
		APPCODE_VM_OPTIONS: string;
		APPDATA: string;
		CHROME_CRASHPAD_PIPE_NAME: string;
		CLASSPATH: string;
		CLION_VM_OPTIONS: string;
		COLORTERM: string;
		CommonProgramFiles: string;
		CommonProgramW6432: string;
		COMPUTERNAME: string;
		ComSpec: string;
		DATAGRIP_VM_OPTIONS: string;
		DATASPELL_VM_OPTIONS: string;
		DEVECOSTUDIO_VM_OPTIONS: string;
		DriverData: string;
		GATEWAY_VM_OPTIONS: string;
		GIT_ASKPASS: string;
		GOLAND_VM_OPTIONS: string;
		HOME: string;
		HOMEDRIVE: string;
		HOMEPATH: string;
		IDEA_VM_OPTIONS: string;
		INIT_CWD: string;
		JAVA_HOME: string;
		JETBRAINSCLIENT_VM_OPTIONS: string;
		JETBRAINS_CLIENT_VM_OPTIONS: string;
		LANG: string;
		LOCALAPPDATA: string;
		LOGONSERVER: string;
		NODE: string;
		NODE_ENV: string;
		npm_command: string;
		npm_config_engine_strict: string;
		npm_config_frozen_lockfile: string;
		npm_config_node_gyp: string;
		npm_config_registry: string;
		npm_config_resolution_mode: string;
		npm_config_strict_ssl: string;
		npm_config_user_agent: string;
		npm_execpath: string;
		npm_lifecycle_event: string;
		npm_lifecycle_script: string;
		npm_node_execpath: string;
		npm_package_dependencies_alova: string;
		npm_package_dependencies__alova_mock: string;
		npm_package_dependencies__alova_scene_svelte: string;
		npm_package_devDependencies_eslint: string;
		npm_package_devDependencies_eslint_config_prettier: string;
		npm_package_devDependencies_eslint_plugin_svelte: string;
		npm_package_devDependencies_prettier: string;
		npm_package_devDependencies_prettier_plugin_svelte: string;
		npm_package_devDependencies_svelte: string;
		npm_package_devDependencies_svelte_check: string;
		npm_package_devDependencies_tslib: string;
		npm_package_devDependencies_typescript: string;
		npm_package_devDependencies_vite: string;
		npm_package_devDependencies_vitest: string;
		npm_package_devDependencies__fontsource_fira_mono: string;
		npm_package_devDependencies__neoconfetti_svelte: string;
		npm_package_devDependencies__playwright_test: string;
		npm_package_devDependencies__sveltejs_adapter_auto: string;
		npm_package_devDependencies__sveltejs_kit: string;
		npm_package_devDependencies__typescript_eslint_eslint_plugin: string;
		npm_package_devDependencies__typescript_eslint_parser: string;
		npm_package_devDependencies__types_cookie: string;
		npm_package_name: string;
		npm_package_scripts_build: string;
		npm_package_scripts_check: string;
		npm_package_scripts_check_watch: string;
		npm_package_scripts_dev: string;
		npm_package_scripts_format: string;
		npm_package_scripts_lint: string;
		npm_package_scripts_preview: string;
		npm_package_scripts_test: string;
		npm_package_scripts_test_unit: string;
		npm_package_type: string;
		npm_package_version: string;
		NUMBER_OF_PROCESSORS: string;
		NVM_HOME: string;
		NVM_SYMLINK: string;
		ORIGINAL_XDG_CURRENT_DESKTOP: string;
		OS: string;
		Path: string;
		PATHEXT: string;
		PHPSTORM_VM_OPTIONS: string;
		PNPM_HOME: string;
		PNPM_SCRIPT_SRC_DIR: string;
		PROCESSOR_ARCHITECTURE: string;
		PROCESSOR_IDENTIFIER: string;
		PROCESSOR_LEVEL: string;
		PROCESSOR_REVISION: string;
		ProgramData: string;
		ProgramFiles: string;
		ProgramW6432: string;
		PROMPT: string;
		PSModulePath: string;
		PUBLIC: string;
		PYCHARM_VM_OPTIONS: string;
		RIDER_VM_OPTIONS: string;
		RUBYMINE_VM_OPTIONS: string;
		SESSIONNAME: string;
		STUDIO_VM_OPTIONS: string;
		SystemDrive: string;
		SystemRoot: string;
		TEMP: string;
		TERM_PROGRAM: string;
		TERM_PROGRAM_VERSION: string;
		TMP: string;
		TURBOCLIENTBIN: string;
		USERDOMAIN: string;
		USERDOMAIN_ROAMINGPROFILE: string;
		USERNAME: string;
		USERPROFILE: string;
		VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
		VSCODE_GIT_ASKPASS_MAIN: string;
		VSCODE_GIT_ASKPASS_NODE: string;
		VSCODE_GIT_IPC_HANDLE: string;
		VSCODE_INJECTION: string;
		WEBIDE_VM_OPTIONS: string;
		WEBSTORM_VM_OPTIONS: string;
		windir: string;
		ZES_ENABLE_SYSMAN: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: string]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
