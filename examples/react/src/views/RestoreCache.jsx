import { invalidateCache } from 'alova';
import { useRequest } from 'alova/client';
import { queryFestivals } from '../api/methods';

function View() {
  const {
    loading,
    error,
    data: festivals
  } = useRequest(queryFestivals(), {
    initialData: []
  });

  const reloadPage = () => {
    location.reload();
  };

  const invalidateOldData = () => {
    invalidateCache(queryFestivals());
    reloadPage();
  };

  if (loading && festivals.length <= 0) {
    return <nord-spinner />;
  }

  if (error) {
    return <span>{error.message}</span>;
  }

  return (
    <nord-card>
      <h3 slot="header">Festivals of This Year</h3>
      <nord-banner type="info">
        <div>
          <nord-button
            variant="plain"
            size="s"
            onClick={reloadPage}>
            Reload page
          </nord-button>
          <span>, you don't need to re-request festival data until next year.</span>
        </div>
        <div>
          <nord-button
            size="s"
            variant="plain"
            class="mt-2"
            onClick={invalidateOldData}>
            Invalidate the persistent data
          </nord-button>
          <span> and reload page, you can see 'Loading...' again.</span>
        </div>
      </nord-banner>
      <div className="grid grid-cols-6 gap-2 mt-4">
        {festivals.map(fes => (
          <nord-badge key={fes.name}>
            [{fes.date}] {fes.name}
          </nord-badge>
        ))}
      </div>
    </nord-card>
  );
}

export default View;
