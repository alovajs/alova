<template>
  <div
    class="flex flex-col md:flex-row md:max-w-[1440px] md:mx-auto h-full"
    :style="{ '--n-color-accent': config.theme }">
    <div
      :class="[
        'fixed top-0 left-[max(0px, calc(50% - 45rem))] bg-white z-20 h-full transition-transform duration-300 flex flex-col w-80 border-r-[1px] border-gray-300 py-8 px-4 md:translate-x-0 overflow-y-auto',
        showMenu ? 'translate-x-0' : '-translate-x-full'
      ]">
      <div class="flex flex-row items-center">
        <img
          class="h-8 mr-2"
          src="https://alova.js.org/img/logo.svg" />
        <h1 class="text-xl font-bold">Alova demos</h1>
        <nord-badge
          class="ml-2"
          :style="{
            '--_n-badge-chip-color': config.theme,
            '--_n-badge-border-color': config.theme,
            '--_n-badge-background-color': '#fff'
          }">
          {{ config.pkgName }}
        </nord-badge>
      </div>
      <div class="grid grid-cols-3 gap-x-2 mt-4">
        <a
          class="py-2 rounded flex-1 bg-slate-100 flex justify-center hover:bg-slate-200 transition-all"
          href="https://github.com/alovajs/alova"
          target="_blank">
          <nord-icon size="l">
            <svg
              viewBox="0 0 1024 1024"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M511.6 76.3C264.3 76.2 64 276.4 64 523.5 64 718.9 189.3 885 363.8 946c23.5 5.9 19.9-10.8 19.9-22.2v-77.5c-135.7 15.9-141.2-73.9-150.3-88.9C215 726 171.5 718 184.5 703c30.9-15.9 62.4 4 98.9 57.9 26.4 39.1 77.9 32.5 104 26 5.7-23.5 17.9-44.5 34.7-60.8-140.6-25.2-199.2-111-199.2-213 0-49.5 16.3-95 48.3-131.7-20.4-60.5 1.9-112.3 4.9-120 58.1-5.2 118.5 41.6 123.2 45.3 33-8.9 70.7-13.6 112.9-13.6 42.4 0 80.2 4.9 113.5 13.9 11.3-8.6 67.3-48.8 121.3-43.9 2.9 7.7 24.7 58.3 5.5 118 32.4 36.8 48.9 82.7 48.9 132.3 0 102.2-59 188.1-200 212.9 23.5 23.2 38.1 55.4 38.1 91v112.5c0.8 9 0 17.9 15 17.9 177.1-59.7 304.6-227 304.6-424.1 0-247.2-200.4-447.3-447.5-447.3z" />
            </svg>
          </nord-icon>
        </a>
        <a
          class="py-2 rounded flex-1 bg-slate-100 flex justify-center hover:bg-slate-200 transition-all"
          href="https://x.com/alovajs"
          target="_blank">
          <nord-icon size="l">
            <svg
              viewBox="0 0 1024 1024"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M806.4 51.2h157.866667l-341.333334 392.533333L1024 972.8h-315.733333l-247.466667-324.266667-281.6 324.266667H21.333333L388.266667 554.666667 0 51.2h324.266667l221.866666 294.4 260.266667-294.4z m-55.466667 827.733333h85.333334L277.333333 136.533333H183.466667l567.466666 742.4z"
                fill="#231815" />
            </svg>
          </nord-icon>
        </a>
        <a
          class="py-2 rounded flex-1 bg-slate-100 flex justify-center hover:bg-slate-200 transition-all"
          href="https://alova.js.org"
          target="_blank">
          <nord-icon size="l">
            <svg
              viewBox="0 0 1024 1024"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M128 256l64 0L192 192 128 192 128 256zM896 64 128 64C57.312 64 0 121.312 0 192l0 768 1024 0L1024 192C1024 121.312 966.688 64 896 64zM960 896 64 896 64 384l896 0L960 896zM960 320 64 320 64 192c0-35.328 28.672-64 64-64l768 0c35.328 0 64 28.672 64 64L960 320zM864 192 416 192c-17.664 0-32 14.336-32 32s14.336 32 32 32l448 0c17.696 0 32-14.336 32-32S881.696 192 864 192zM256 256l64 0L320 192 256 192 256 256z" />
            </svg>
          </nord-icon>
        </a>
      </div>
      <div class="flex flex-col mt-8">
        <div
          v-for="route in routes"
          :key="route.category"
          class="flex flex-col mb-8">
          <h4 class="font-bold mb-3">{{ route.category }}</h4>
          <div class="flex flex-col border-l-[1px] border-gray-200">
            <a
              v-for="item in route.items"
              :key="item.title"
              @click="handleMenuClick(route, item)"
              class="pl-4 border-l-[1px] -ml-[1px] hover:border-primary cursor-pointer my-2">
              {{ item.title }}
            </a>
          </div>
        </div>
      </div>
    </div>
    <!-- mask -->
    <div
      :class="['fixed top-0 left-0 w-[100vw] h-full z-10 bg-gray-800 bg-opacity-30', showMenu ? 'block' : 'hidden']"
      @click="showMenu = false"></div>
    <div class="p-8 md:pl-96 flex flex-col flex-1">
      <nord-button
        class="block md:hidden text-2xl"
        @click="showMenu = true"
        variant="plain">
        <nord-icon
          size="l"
          name="navigation-toggle"></nord-icon>
      </nord-button>
      <div class="flex flex-col mb-6 md:flex-row md:justify-between">
        <div class="flex flex-row items-center justify-between mb-2 md:justify-start">
          <h2 class="font-bold text-2xl mr-4">{{ activeView.title }}</h2>
          <nord-dropdown
            size="s"
            ref="dropdownRef">
            <nord-button slot="toggle">
              {{ networkOptions.find(n => n.value === network)?.title || 'Unknown' }}
            </nord-button>
            <nord-dropdown-item
              v-for="{ title, value } in networkOptions"
              :key="value"
              @click="network = value">
              {{ title }}
            </nord-dropdown-item>
          </nord-dropdown>
        </div>
        <FileViewer
          v-if="typeof activeView.source === 'string' || activeView.source === undefined"
          :filePath="activeView.source || activeView.title.replace(/\s/g, '')"
          :docPath="activeView.doc"
          showPath />
      </div>
      <nord-banner
        v-if="activeView.description"
        class="mb-4">
        <div>
          <h3 class="title">Demo description</h3>
          <p class="whitespace-pre-line">{{ activeView.description }}</p>
        </div>
      </nord-banner>
      <component :is="activeView.component" />
    </div>
    <!-- unique toast component -->
    <nord-toast-group
      ref="toastGroupRef"
      autoDismiss="3000"></nord-toast-group>
  </div>
</template>

<script setup>
import { invalidateCache } from 'alova';
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import config from '../config';
import { networkStatus } from './api';
import FileViewer from './components/FileViewer';
import { provideToast } from './helper';
import routes from './routes';

const formatActiveRoute = (category, title) => `${category.toLowerCase()}.${title.toLowerCase().replace(/\s/g, '_')}`;
const defaultPath = formatActiveRoute(routes[0].category, routes[0].items[0].title);

const path = new URLSearchParams(location.search).get('path') || defaultPath;
const activeRoute = ref(path);
const showMenu = ref(false);

const activeView = computed(() => {
  const [activeCategory] = activeRoute.value.split('.');
  const targetCategory = routes.find(r => r.category.toLowerCase() === activeCategory);
  const view = targetCategory?.items.find(
    ({ title }) => formatActiveRoute(targetCategory.category, title) === activeRoute.value
  );
  window.__page = view;
  return {
    ...view,
    component: defineAsyncComponent(view.component)
  };
});

const toastGroupRef = ref();
provideToast.instance = toastGroupRef;

onMounted(() => {
  window.addEventListener('popstate', () => {
    const path = new URLSearchParams(location.search).get('path');
    activeRoute.value = path || defaultPath;
  });
});

const handleMenuClick = (route, item) => {
  const routeFlag = formatActiveRoute(route.category, item.title);
  history.pushState({}, '', `?path=${routeFlag}`);
  activeRoute.value = routeFlag;
  showMenu.value = false;

  // Clear cache after switching routes to avoid cache interference with each other
  invalidateCache();
};

const networkOptions = [
  { title: 'Online', value: 1 },
  { title: 'Unreliable Network', value: 2 },
  { title: 'Offline', value: 0 }
];
const network = ref(networkStatus.value);
const dropdownRef = ref();

watch(network, newNetwork => {
  networkStatus.value = newNetwork;
  dropdownRef.value.hide();
});
</script>
