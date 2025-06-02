import { render, screen } from '@testing-library/svelte';
import { delay } from 'root/testUtils';
import page from './components/page-useRequest.svelte';

// use hook no longer sends requests on the server side
describe('[svelte]use hooks in SSR', () => {
  test("shouldn't request but loading is true", async () => {
    render(page);
    expect(screen.getByRole('status')).toHaveTextContent('loading');
    expect(screen.getByRole('path')).toBeEmptyDOMElement();
    expect(screen.getByRole('method')).toBeEmptyDOMElement();

    // It will still be in the pre-request state after 200ms.
    await delay(200);
    expect(screen.getByRole('status')).toHaveTextContent('loading');
    expect(screen.getByRole('path')).toBeEmptyDOMElement();
    expect(screen.getByRole('method')).toBeEmptyDOMElement();
  });
});
