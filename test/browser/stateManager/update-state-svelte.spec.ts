import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/svelte';
import page from '../../components/svelte/page-updateState.svelte';
import { mockServer, untilCbCalled } from '../../utils';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('update cached response data by user in Svelte', () => {
	test('the cached response data should be changed and the screen should be update', async () => {
		render(page);
		await screen.findByText(/loaded/);
		expect(screen.getByRole('path')).toHaveTextContent('/unit-test');

		fireEvent.click(screen.getByRole('button'));
		await untilCbCalled(setTimeout, 100);
		expect(screen.getByRole('path')).toHaveTextContent('/unit-test-updated');
	});
});
