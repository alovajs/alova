<script>
  import { useRequest } from 'alova/client';
  import { queryStudentDetail } from '../../api/methods';
  import FileViewer from '../../components/FileViewer.svelte';
  import EditCard from './EditCard1.svelte';

  const filePath = window.__page.source[0];
  const docPath = window.__page.doc[0];
  const { loading, error, data } = useRequest(queryStudentDetail(1), {
    initialData: {}
  });
</script>

{#if $loading}
  <nord-spinner />
{:else if $error}
  <span class="text-red-500">{$error.message}</span>
{:else}
  <nord-card>
    <div slot="header">
      <FileViewer
        {filePath}
        {docPath}>
        <h3 class="title">update state by `updateState`</h3>
      </FileViewer>
    </div>
    <div class="grid gap-y-2 text-lg">
      <div>id: {$data.id}</div>
      <div>name: {$data.name}</div>
      <div>class: {$data.cls}</div>
    </div>
    <div slot="footer">
      <EditCard />
    </div>
  </nord-card>
{/if}
