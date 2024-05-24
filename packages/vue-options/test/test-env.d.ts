declare module '*.vue' {
  import { ComponentOptions } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: ComponentOptions;
  export default component;
}

declare const isVue3: boolean;
