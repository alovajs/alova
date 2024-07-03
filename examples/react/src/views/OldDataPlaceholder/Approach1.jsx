import { useRequest } from 'alova/client';
import { alova } from '../../api';
import { queryRandom } from '../../api/methods';
import FileViewer from '../../components/FileViewer';
import { showToast } from '../../helper';

const cacheKey = 'placeholder-cache';
function Approach1() {
  const methodOfQueryRandom = queryRandom();
  const {
    loading,
    error,
    data: randomNumbers
  } = useRequest(methodOfQueryRandom, {
    initialData() {
      const cache = alova.l2Cache.get(cacheKey);
      return cache || [];
    }
  }).onSuccess(({ data }) => {
    alova.l2Cache.set(cacheKey, data);
  });
  const handleClearCache = () => {
    alova.l2Cache.remove(cacheKey);
    showToast('Cache is cleared');
  };

  if (loading && randomNumbers.length <= 0) {
    return <nord-spinner />;
  }

  if (error) {
    return <span className="text-red-500">{error.message}</span>;
  }

  return (
    <nord-card>
      <div slot="header">
        <FileViewer filePath="OldDataPlaceholder/Approach1">
          <h3 className="title">Use `initialData` function</h3>
        </FileViewer>
      </div>
      <div className="grid gap-2 grid-cols-[fit-content(100px)_fit-content(100px)] mb-4">
        <nord-button onClick={() => location.reload()}>Reload page</nord-button>
        <nord-button onClick={handleClearCache}>Clear Cache</nord-button>
      </div>
      <div className="flex flex-row">
        {randomNumbers.map(num => (
          <nord-badge
            key={num}
            class="mr-2">
            {num}
          </nord-badge>
        ))}
      </div>
    </nord-card>
  );
}

export default Approach1;
