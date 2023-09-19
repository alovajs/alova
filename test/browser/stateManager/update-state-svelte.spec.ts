import page from '#/components/svelte/page-updateState.svelte';
import pageUserWatcherImmediate from '#/components/svelte/page-useWatcher-immediate.svelte';
import { getStateCache } from '@/storage/stateCache';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { untilCbCalled } from '~/test/utils';

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
    await untilCbCalled(setTimeout, 100);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('0');
    expect(screen.getByRole('id2')).toHaveTextContent('10');
    const alovaId = screen.getByRole('alovaId').innerHTML;
    const methodKey1 = screen.getByRole('methodKey').innerHTML;
    expect(getStateCache(alovaId, methodKey1)).not.toBeUndefined();

    // 需要暂停一段时间再触发事件和检查响应数据
    fireEvent.click(screen.getByRole('button'));
    await untilCbCalled(setTimeout, 100);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('11');
    const methodKey2 = screen.getByRole('methodKey').innerHTML;
    expect(getStateCache(alovaId, methodKey2)).not.toBeUndefined();

    // 组件卸载后，对应缓存状态会被删除
    unmount();
    await waitFor(() => {
      // 空对象表示未匹配到状态缓存
      expect(getStateCache(alovaId, methodKey1)).toStrictEqual({});
      expect(getStateCache(alovaId, methodKey2)).toStrictEqual({});
    });
  });
});
