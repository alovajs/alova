import page from '#/components/svelte/page-useRequest.svelte';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';

(isSSR ? xdescribe : describe)('useRequet hook with svelte', () => {
  test('send GET', async () => {
    render(page);
    expect(screen.getByRole('status')).toHaveTextContent('loading');
    const loadingEl = await screen.findByText(/loaded/);
    expect(loadingEl).toHaveTextContent('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('method')).toHaveTextContent('GET');
  });
});
