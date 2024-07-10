<script>
  import { accessAction } from 'alova/client';
  import FileViewer from '../../components/FileViewer';

  const filePath = window.__page.source[1];
  const docPath = window.__page.doc;
  let suffix = '';

  // handleInput方法用于处理输入事件
  const handleInput = event => {
    suffix = event.target.value;
  };

  // handleRefreshSideMenu方法用于触发刷新侧边菜单的操作
  const handleRefreshSideMenu = () => {
    accessAction('target:data', ({ send }) => send({ suffix }));
  };
</script>

<nord-card>
  <div slot="header">
    <FileViewer
      showPath
      {filePath}
      {docPath}>
      <h3 class="title">Controller Panel</h3>
    </FileViewer>
  </div>
  <div class="grid gap-y-4">
    <nord-banner> Input a suffix and click button, it will trigger the request in `Data Panel` component </nord-banner>
    <nord-input
      label="Suffix"
      value={suffix}
      on:input={({ target }) => (suffix = target.value)} />
    <nord-button on:click={handleRefreshSideMenu}>Re-request with this suffix</nord-button>
  </div>
</nord-card>
