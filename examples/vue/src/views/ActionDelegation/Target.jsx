import { actionDelegationMiddleware, useRequest } from 'alova/client';
import { getData } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

function Target() {
  const { data, loading, error } = useRequest(getData, {
    initialData: [],
    middleware: actionDelegationMiddleware('target:data')
  });

  const content = () => {
    if (loading) {
      return <nord-spinner size="s" />;
    } else if (error) {
      return <div>{error.message}</div>;
    }
    return (
      <div className="grid grid-cols-[repeat(8,fit-content(100px))] gap-2">
        {data.map(item => (
          <nord-badge
            key={item}
            class="mr-2"
            variant="success">
            {item}
          </nord-badge>
        ))}
      </div>
    );
  };

  return (
    <nord-card>
      <div slot="header">
        <FileViewer
          showPath
          filePath={window.__page.source[0]}
          docPath={window.__page.doc}>
          <h3 className="title">Data Panel</h3>
        </FileViewer>
      </div>
      {content()}
    </nord-card>
  );
}

export default Target;
