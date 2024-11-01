import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { delay } from 'root/testUtils';
import pageAbortLast from '../components/page-useWatcher-abortLast.svelte';
import pageDebounceImmediate from '../components/page-useWatcher-debounce-immediate.svelte';
import pageDifferentDebounce from '../components/page-useWatcher-different-debounce.svelte';
import pageImmediate from '../components/page-useWatcher-immediate.svelte';
import pageSendable from '../components/page-useWatcher-sendable.svelte';
import page from '../components/page-useWatcher.svelte';

describe('useWatcher hook with svelte', () => {
  test('should send request when change value', async () => {
    render(page);
    // It is necessary to pause for a period of time before triggering the event and checking the response data.
    await delay(100);
    fireEvent.click(screen.getByRole('btn1'));
    await delay(500);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('10');
    fireEvent.click(screen.getByRole('btn2'));
    await delay(500);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('11');
  });

  test('should get the response that request at last when change value', async () => {
    const mockSuccessFn = vi.fn();
    render(pageAbortLast, { successFn: mockSuccessFn });
    // It is necessary to pause for a period of time before triggering the event and checking the response data.
    await delay(10);
    fireEvent.click(screen.getByRole('btn1'));
    await delay(10);
    fireEvent.click(screen.getByRole('btn2'));
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(mockSuccessFn).toHaveBeenCalledTimes(1);
    });
  });

  test('should ignore the error which is not the last request', async () => {
    const mockSuccessFn = vi.fn();
    const mockErrorFn = vi.fn();
    render(pageAbortLast, { successFn: mockSuccessFn, throwError: true, errorFn: mockErrorFn });
    // It is necessary to pause for a period of time before triggering the event and checking the response data.
    await delay(10);
    fireEvent.click(screen.getByRole('btn1'));
    await delay(10);
    fireEvent.click(screen.getByRole('btn2'));
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(mockSuccessFn).toHaveBeenCalledTimes(1);
      expect(mockErrorFn).not.toHaveBeenCalled();
      expect(screen.getByRole('error')).toHaveTextContent('');
    });
  });

  // vi.setConfig({ testTimeout: 1000_000 });
  test('should receive last response when set abortLast to false', async () => {
    const mockSuccessFn = vi.fn();
    render(pageAbortLast, { successFn: mockSuccessFn, abortLast: false });
    // It is necessary to pause for a period of time before triggering the event and checking the response data.
    await delay(10);
    fireEvent.click(screen.getByRole('btn1'));
    await delay(10);
    fireEvent.click(screen.getByRole('btn2'));
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test-1s');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(mockSuccessFn).toHaveBeenCalledTimes(2);
    });
  });

  test('should not send request when change value but returns false in sentable', async () => {
    const sendableFn = vi.fn();
    render(pageSendable, { sendableFn } as any);

    // It is necessary to pause for a period of time before triggering the event and checking the response data.
    await delay(100);
    fireEvent.click(screen.getByRole('btn1'));
    await delay(500);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('10');
    expect(sendableFn).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('btn1'));
    await delay(500);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('10');
    expect(sendableFn).toHaveBeenCalledTimes(2);
  });

  test('should not send request when change value but throws error in sendable', async () => {
    const sendableFn = vi.fn();
    render(pageSendable, {
      sendableFn,
      errorInSendable: true
    } as any);

    // It is necessary to pause for a period of time before triggering the event and checking the response data.
    await delay(100);
    fireEvent.click(screen.getByRole('btn1'));
    await delay(500);
    expect(screen.getByRole('path')).toHaveTextContent('');
    expect(screen.getByRole('id1')).toHaveTextContent('');
    expect(screen.getByRole('id2')).toHaveTextContent('');
    expect(sendableFn).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('btn2'));
    await delay(500);
    expect(screen.getByRole('path')).toHaveTextContent('');
    expect(screen.getByRole('id1')).toHaveTextContent('');
    expect(screen.getByRole('id2')).toHaveTextContent('');
    expect(sendableFn).toHaveBeenCalledTimes(2);
  });

  test('the loading state should be recovered to false when send request immediately', async () => {
    const sendableFn = vi.fn();
    render(pageSendable, {
      sendableFn,
      immediate: true
    } as any);

    await delay(100);
    expect(screen.getByRole('path')).toHaveTextContent('');
    expect(screen.getByRole('status')).toHaveTextContent('loaded');
    expect(screen.getByRole('id2')).toHaveTextContent('');
    expect(sendableFn).toHaveBeenCalledTimes(1);
  });

  test('should send request when init', async () => {
    render(pageImmediate);
    await delay(500);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('0');
    expect(screen.getByRole('id2')).toHaveTextContent('10');

    // It is necessary to pause for a period of time before triggering the event and checking the response data.
    fireEvent.click(screen.getByRole('button'));
    await delay(500);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('11');
    fireEvent.click(screen.getByRole('button'));
    await delay(500);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('2');
    expect(screen.getByRole('id2')).toHaveTextContent('12');
  });

  test('should send request immediately even if set debounce', async () => {
    render(pageDebounceImmediate);
    await delay(100);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('0');
    expect(screen.getByRole('id2')).toHaveTextContent('10');

    // It is necessary to pause for a period of time before triggering the event and checking the response data.
    fireEvent.click(screen.getByRole('btn1'));
    fireEvent.click(screen.getByRole('btn2'));
    await delay(800);
    expect(screen.getByRole('id1')).toHaveTextContent('0');
    expect(screen.getByRole('id2')).toHaveTextContent('10');
    await delay(300);
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('11');

    // Synchronously modifying data twice triggers only one request
    expect(screen.getByRole('successTimes')).toHaveTextContent('2');
  });

  test('should perform different debounce time in listening states when set param debounce to be an array', async () => {
    render(pageDifferentDebounce);
    // No request sent yet
    expect(screen.getByRole('path')).toHaveTextContent('');
    expect(screen.getByRole('id1')).toHaveTextContent('');
    expect(screen.getByRole('id2')).toHaveTextContent('');

    await delay(100);
    fireEvent.click(screen.getByRole('btn1'));
    await delay(600);
    // Because of the delay of 1000 milliseconds, the request will not be triggered yet
    expect(screen.getByRole('path')).toHaveTextContent('');
    expect(screen.getByRole('id1')).toHaveTextContent('');
    expect(screen.getByRole('id2')).toHaveTextContent('');

    // Request responded
    await delay(500);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('10');

    fireEvent.click(screen.getByRole('btn2'));
    await delay(150);
    // Because the state id is delayed by 200 milliseconds, it will not be triggered yet.
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('10');
    await delay(100);
    // Request responded
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('11');

    // If changed at the same time, the later one shall prevail.
    fireEvent.click(screen.getByRole('btn1'));
    fireEvent.click(screen.getByRole('btn2'));
    await delay(360);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('2');
    expect(screen.getByRole('id2')).toHaveTextContent('12');
  });
});
