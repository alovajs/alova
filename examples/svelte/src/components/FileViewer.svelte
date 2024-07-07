<script>
  import config from '../../config';

  export let filePath;
  export let docPath = null;
  export let showPath = false;
  export let children = [];
  export let className = '';

  $: hasChildren = children.length > 0;

  function handleToGithub() {
    window.open(
      `https://github.com/alovajs/alova/blob/${config.sourceBranch ? `${config.sourceBranch}/` : ''}examples/${config.pkgName}/src/views/${filePath}.${config.fileExt}`
    );
  }

  function handleToDoc() {
    window.open(`${config.docUrl}tutorial/${docPath}`);
  }
</script>

<div class="flex flex-row items-center justify-between {className}">
  <slot></slot>
  <div class="flex items-center ml-2">
    <div
      on:click={handleToGithub}
      class="rounded-lg bg-slate-100 cursor-pointer transition-colors hover:bg-slate-200 flex flex-row items-center justify-between {hasChildren
        ? 'ml-2'
        : ''} {showPath ? 'px-4 py-2' : ''}">
      {#if showPath}
        <span class="font-mono font-bold mr-2 break-all">
          Source: src/views/{filePath}.{config.fileExt}
        </span>
      {/if}
      <nord-icon
        size="l"
        class="text-2xl hover:text-black">
        <svg
          viewBox="0 0 1024 1024"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M511.6 76.3C264.3 76.2 64 276.4 64 523.5 64 718.9 189.3 885 363.8 946c23.5 5.9 19.9-10.8 19.9-22.2v-77.5c-135.7 15.9-141.2-73.9-150.3-88.9C215 726 171.5 718 184.5 703c30.9-15.9 62.4 4 98.9 57.9 26.4 39.1 77.9 32.5 104 26 5.7-23.5 17.9-44.5 34.7-60.8-140.6-25.2-199.2-111-199.2-213 0-49.5 16.3-95 48.3-131.7-20.4-60.5 1.9-112.3 4.9-120 58.1-5.2 118.5 41.6 123.2 45.3 33-8.9 70.7-13.6 112.9-13.6 42.4 0 80.2 4.9 113.5 13.9 11.3-8.6 67.3-48.8 121.3-43.9 2.9 7.7 24.7 58.3 5.5 118 32.4 36.8 48.9 82.7 48.9 132.3 0 102.2-59 188.1-200 212.9 23.5 23.2 38.1 55.4 38.1 91v112.5c0.8 9 0 17.9 15 17.9 177.1-59.7 304.6-227 304.6-424.1 0-247.2-200.4-447.3-447.5-447.3z" />
        </svg>
      </nord-icon>
    </div>
    {#if docPath}
      <img
        title="Show current document"
        src="/doubt.png"
        on:click={handleToDoc}
        class="ml-2 cursor-pointer {showPath ? 'w-12' : 'w-8'}" />
    {/if}
  </div>
</div>
