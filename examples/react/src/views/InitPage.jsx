import { useRequest } from 'alova/client';
import { getData } from '../api/methods';

function View() {
  const { data, loading, error } = useRequest(getData, {
    initialData: []
  });

  if (loading) {
    return <sl-spinner size="small" />;
  } else if (error) {
    return <div>{error.message}</div>;
  }
  return (
    <div className="flex flex-row">
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
}

export default View;
