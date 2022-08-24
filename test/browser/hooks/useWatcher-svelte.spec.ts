import { mockServer, untilCbCalled } from '../../utils';
import '@testing-library/jest-dom'
import {fireEvent, render, screen} from '@testing-library/svelte';
import page from '../../components/svelte/page-useWatcher.svelte';
import pageImmediate from '../../components/svelte/page-useWatcher-immediate.svelte';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());
describe('useWatcher hook with svelte', () => {
  test('should send request when change value', async () => {
    render(page);
    // 需要暂停一段时间再触发事件和检查响应数据
    await untilCbCalled(setTimeout, 100);
    fireEvent.click(screen.getByRole('button'));
    await untilCbCalled(setTimeout, 500);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('11');
    fireEvent.click(screen.getByRole('button'));
    await untilCbCalled(setTimeout, 500);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('2');
    expect(screen.getByRole('id2')).toHaveTextContent('12');
  });

  test('should send request when init', async () => {
    render(pageImmediate);
    await untilCbCalled(setTimeout, 500);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('0');
    expect(screen.getByRole('id2')).toHaveTextContent('10');

    // 需要暂停一段时间再触发事件和检查响应数据
    fireEvent.click(screen.getByRole('button'));
    await untilCbCalled(setTimeout, 500);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('11');
    fireEvent.click(screen.getByRole('button'));
    await untilCbCalled(setTimeout, 500);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('2');
    expect(screen.getByRole('id2')).toHaveTextContent('12');
  });
});