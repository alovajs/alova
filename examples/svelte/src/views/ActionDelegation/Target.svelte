<script>
  import { actionDelegationMiddleware, useRequest } from 'alova/client';
  import { getData } from '../../api/methods';
  import FileViewer from '../../components/FileViewer';

  const filePath = window.__page.source[0];
  const docPath = window.__page.doc;

  // 使用useRequest获取数据
  const { data, loading, error } = useRequest(getData, {
    initialData: [],
    middleware: actionDelegationMiddleware('target:data')
  });
</script>

<nord-card>
  <div slot="header">
    <FileViewer
      showPath
      {filePath}
      {docPath}>
      <h3 class="title">Data Panel</h3>
    </FileViewer>
  </div>
  {#if $loading}
    <nord-spinner size="s" />
  {:else if $error}
    <div>{$error.message}</div>
  {:else}
    <div class="grid grid-cols-[repeat(8,fit-content(100px))] gap-2">
      {#each $data as item (item)}
        <nord-badge
          class="mr-2"
          variant="success">
          {item}
        </nord-badge>
      {/each}
    </div>
  {/if}
</nord-card>
