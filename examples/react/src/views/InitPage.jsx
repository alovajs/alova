import { useRequest } from 'alova/client';
import { getData } from '../api/methods';

function View() {
  const { data, loading, error } = useRequest(getData, {
    initialData: []
  });

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
}

export default View;
