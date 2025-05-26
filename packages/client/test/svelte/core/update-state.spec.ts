import { getStateCache } from '@/hooks/core/implements/stateCache';
import page from '../components/page-updateState.svelte';
import pageUserWatcherImmediate from '../components/page-useWatcher-immediate.svelte';

import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { delay } from 'root/testUtils';

describe('update cached response data by user in svelte', () => {
  test('the cached response data should be changed and the screen should be update', async () => {
    render(page);
    await screen.findByText(/loaded/);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test-updated');
    });
  });

  test('all saved states in unmounted component will be removed', async () => {
    const { unmount } = render(pageUserWatcherImmediate);
    await delay(100);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('0');
    expect(screen.getByRole('id2')).toHaveTextContent('10');
    const alovaId = screen.getByRole('alovaId').innerHTML;
    const methodKey1 = screen.getByRole('methodKey').innerHTML;
    expect(getStateCache(alovaId, methodKey1)).not.toHaveLength(0);

    // It is necessary to pause for a period of time before triggering the event and checking the response data.
    fireEvent.click(screen.getByRole('button'));
    await delay(100);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('11');
    const methodKey2 = screen.getByRole('methodKey').innerHTML;
    expect(getStateCache(alovaId, methodKey2)).not.toHaveLength(0);

    // After the component is uninstalled, the corresponding cache status will be deleted.
    unmount();
    await waitFor(() => {
      // An empty object indicates that the state cache is not matched.
      expect(getStateCache(alovaId, methodKey1)).toHaveLength(0);
      expect(getStateCache(alovaId, methodKey2)).toHaveLength(0);
    });
  });
});
