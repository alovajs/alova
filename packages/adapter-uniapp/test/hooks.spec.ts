import UniappEventSource from '@/UniappEventSource';
import AdapterUniapp from '@/index';
import { useAutoRequest, useSSE, useUploader } from 'alova/client';

const uniMock = (global as any).uni;

describe('uniapp hooks config', () => {
  test('should set useSSE.EventSource to UniappEventSource', () => {
    AdapterUniapp();
    expect(useSSE.EventSource).toBe(UniappEventSource);
  });

  test('should select files via uni.chooseFile', async () => {
    AdapterUniapp();
    const tempFile = { path: '/tmp/a.png', size: 100, name: 'a.png', type: 'image/png' };
    uniMock.chooseFile = vi.fn(({ success }) => success({ tempFiles: [tempFile] }));

    const files = await useUploader.selectFile({ multiple: true });

    expect(uniMock.chooseFile).toHaveBeenCalledTimes(1);
    expect(uniMock.chooseFile.mock.calls[0][0].count).toBeUndefined();
    expect(files).toHaveLength(1);
    expect(files[0].file).toBe(tempFile);
    expect(files[0].name).toBe('a.png');
    expect(files[0].mimeType).toBe('image/png');
  });

  test('should add uniapp tempFile converter', () => {
    AdapterUniapp();
    const converter = useUploader.converters.find(({ name }) => name === 'uniapp-file');
    expect(converter).toBeTruthy();
    const tempFile = { path: '/tmp/a.png', size: 100, name: 'a.png', type: 'image/png' };
    expect(converter!.is({ file: tempFile })).toBeTruthy();
    expect(converter!.convert({ file: tempFile })).toBe(tempFile);
  });

  test('should bind network/focus/visibility listeners via uni APIs', () => {
    AdapterUniapp();
    const notify = vi.fn();

    let networkCb: any;
    uniMock.onNetworkStatusChange = vi.fn((cb: any) => (networkCb = cb));
    uniMock.offNetworkStatusChange = vi.fn();
    const offNetwork = useAutoRequest.onNetwork(notify, {} as any);
    expect(uniMock.onNetworkStatusChange).toHaveBeenCalledTimes(1);
    networkCb({ isConnected: true });
    expect(notify).toHaveBeenCalledTimes(1);
    networkCb({ isConnected: false });
    expect(notify).toHaveBeenCalledTimes(1);
    offNetwork();
    expect(uniMock.offNetworkStatusChange).toHaveBeenCalledTimes(1);

    let appShowCb: any;
    uniMock.onAppShow = vi.fn((cb: any) => (appShowCb = cb));
    uniMock.offAppShow = vi.fn();
    const offFocus = useAutoRequest.onFocus(notify, {} as any);
    expect(uniMock.onAppShow).toHaveBeenCalledTimes(1);
    appShowCb();
    expect(notify).toHaveBeenCalledTimes(2);
    offFocus();
    expect(uniMock.offAppShow).toHaveBeenCalledTimes(1);

    // onVisibility also binds to app show
    uniMock.onAppShow = vi.fn((cb: any) => (appShowCb = cb));
    const offVisibility = useAutoRequest.onVisibility(notify, {} as any);
    expect(uniMock.onAppShow).toHaveBeenCalledTimes(1);
    appShowCb();
    expect(notify).toHaveBeenCalledTimes(3);
    offVisibility();
  });
});
