<script>
  import { useAutoRequest } from 'alova/client';
  import { getLatestTime } from '../../api/methods';
  import FileViewer from '../../components/FileViewer.svelte';

  const filePath = window.__page.source[2];
  const docPath = window.__page.doc;
  let isStop = false;
  const { loading, data } = useAutoRequest(getLatestTime, {
    enableNetwork: true,
    enableVisibility: false,
    enableFocus: false,
    middleware(_, next) {
      if (!isStop) {
        next();
      }
    }
  });

  const toggleStop = () => {
    isStop = !isStop;
  };
</script>

<div class="grid gap-y-4">
  <FileViewer
    {filePath}
    {docPath}>
    <nord-banner variant="danger">Try to toggle your network</nord-banner>
  </FileViewer>
  <nord-button
    on:click={toggleStop}
    variant="primary">
    <nord-icon
      class="mr-2"
      name={isStop ? 'interface-play' : 'interface-pause'} />
    {isStop ? 'Start Request' : 'Stop Request'}
  </nord-button>
  <div class="flex">
    <span>Refresh Time: {$data || '--'}</span>
    {#if $loading}
      <nord-spinner />
    {/if}
  </div>
</div>
