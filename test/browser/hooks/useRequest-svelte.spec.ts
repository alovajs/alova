import server from '../../server';
import '@testing-library/jest-dom'
import {render, screen} from '@testing-library/svelte';
import page from '../../components/svelte/page-useRequest.svelte';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
describe('useRequet hook with svelte', () => {
  test('send GET', async () => {
    render(page);
    expect(screen.getByRole('status')).toHaveTextContent('loading');
    const loadingEl = await screen.findByText(/loaded/);
    expect(loadingEl).toHaveTextContent('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('method')).toHaveTextContent('GET');
  });
});