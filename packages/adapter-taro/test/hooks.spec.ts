import TaroEventSource from '@/TaroEventSource';
import AdapterTaro from '@/adapterVue';
import Taro from '@tarojs/taro';
import { useAutoRequest, useSSE, useUploader } from 'alova/client';

vi.mock('@tarojs/taro');

const taroMock = Taro as any;

describe('taro hooks config', () => {
  test('should set useSSE.EventSource to TaroEventSource', () => {
    AdapterTaro();
    expect(useSSE.EventSource).toBe(TaroEventSource);
  });

  test('should select files via Taro.chooseFile', async () => {
    AdapterTaro();
    const tempFile = { path: '/tmp/a.png', size: 100, name: 'a.png', type: 'image/png' };
    taroMock.chooseFile = vi.fn(({ success }) => success({ tempFiles: [tempFile] }));

    const files = await useUploader.selectFile({ multiple: true });

    expect(taroMock.chooseFile).toHaveBeenCalledTimes(1);
    expect(taroMock.chooseFile.mock.calls[0][0].count).toBeUndefined();
    expect(files).toHaveLength(1);
    expect(files[0].file).toBe(tempFile);
    expect(files[0].name).toBe('a.png');
    expect(files[0].mimeType).toBe('image/png');
  });

  test('should add taro tempFile converter', () => {
    AdapterTaro();
    const converter = useUploader.converters.find(({ name }) => name === 'taro-file');
    expect(converter).toBeTruthy();
    const tempFile = { path: '/tmp/a.png', size: 100, name: 'a.png', type: 'image/png' };
    expect(converter!.is({ file: tempFile })).toBeTruthy();
    expect(converter!.convert({ file: tempFile })).toBe(tempFile);
  });

  test('should bind network/focus/visibility listeners via Taro APIs', () => {
    AdapterTaro();
    const notify = vi.fn();

    let networkCb: any;
    taroMock.onNetworkStatusChange = vi.fn((cb: any) => (networkCb = cb));
    taroMock.offNetworkStatusChange = vi.fn();
    const offNetwork = useAutoRequest.onNetwork(notify, {} as any);
    expect(taroMock.onNetworkStatusChange).toHaveBeenCalledTimes(1);
    networkCb({ isConnected: true });
    expect(notify).toHaveBeenCalledTimes(1);
    networkCb({ isConnected: false });
    expect(notify).toHaveBeenCalledTimes(1);
    offNetwork();
    expect(taroMock.offNetworkStatusChange).toHaveBeenCalledTimes(1);

    let appShowCb: any;
    taroMock.onAppShow = vi.fn((cb: any) => (appShowCb = cb));
    taroMock.offAppShow = vi.fn();
    const offFocus = useAutoRequest.onFocus(notify, {} as any);
    expect(taroMock.onAppShow).toHaveBeenCalledTimes(1);
    appShowCb();
    expect(notify).toHaveBeenCalledTimes(2);
    offFocus();
    expect(taroMock.offAppShow).toHaveBeenCalledTimes(1);

    taroMock.onAppShow = vi.fn((cb: any) => (appShowCb = cb));
    const offVisibility = useAutoRequest.onVisibility(notify, {} as any);
    expect(taroMock.onAppShow).toHaveBeenCalledTimes(1);
    appShowCb();
    expect(notify).toHaveBeenCalledTimes(3);
    offVisibility();
  });
});
