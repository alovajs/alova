declare module '*.vue' {
  import { DefineComponent } from 'vue';

  const component: DefineComponent<any, {}, any>;
  export default component;
}
