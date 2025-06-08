import type { NuxtApp } from 'nuxt/app';
import { DataSerializer } from '../clienthook';
import { VueHookType } from './vue';

export interface NuxtHookConfig {
  nuxtApp: () => NuxtApp;
  serializers?: Record<string, DataSerializer>;
}

declare const nuxtHook: (config: NuxtHookConfig) => VueHookType;
export default nuxtHook;
