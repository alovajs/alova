import Taro from '@tarojs/taro';
import { useAutoRequest, useSSE, useUploader } from 'alova/client';
import TaroEventSource from './TaroEventSource';

type SelectFileOptions = Parameters<typeof useUploader.selectFile>[0];

/**
 * taro 平台的文件选择器，基于 `Taro.chooseFile`
 */
const taroSelectFile = ({ multiple, accept }: SelectFileOptions = {}) =>
  new Promise(resolve => {
    (Taro as any).chooseFile({
      count: multiple ? undefined : 1,
      extension: accept ? [accept] : undefined,
      success: (res: any) => {
        resolve(
          (res.tempFiles || []).map((file: any) => ({
            file,
            name: file.name,
            mimeType: file.type
          }))
        );
      },
      fail: () => resolve([])
    });
  });

/**
 * 识别 taro 选择的临时文件对象（含 `path` 字段），直接作为上传文件使用
 */
const taroFileConverter = {
  name: 'taro-file',
  is: (rawFile: any) => !!rawFile?.file && typeof rawFile.file === 'object' && typeof rawFile.file.path === 'string',
  convert: (rawFile: any) => rawFile.file
};

/**
 * 在 taro 适配器中自动注入平台相关的 hook 配置：
 * - `useSSE.EventSource`：使用 taro 的 EventSource 实现
 * - `useUploader.selectFile` / `useUploader.converters`：使用 taro 的文件选择与类型转换
 * - `useAutoRequest.onNetwork` / `onFocus` / `onVisibility`：使用 taro 的网络/前台监听
 */
export const setupHooks = () => {
  useSSE.EventSource = TaroEventSource;

  useUploader.selectFile = taroSelectFile as typeof useUploader.selectFile;
  if (!useUploader.converters.some(({ name }) => name === taroFileConverter.name)) {
    useUploader.converters.push(taroFileConverter as any);
  }

  useAutoRequest.onNetwork = notify => {
    const handle = (res: any) => {
      res.isConnected && notify();
    };
    Taro.onNetworkStatusChange(handle);
    return () => Taro.offNetworkStatusChange(handle);
  };
  useAutoRequest.onFocus = notify => {
    const handle = () => notify();
    Taro.onAppShow(handle);
    return () => Taro.offAppShow(handle);
  };
  useAutoRequest.onVisibility = notify => {
    const handle = () => notify();
    Taro.onAppShow(handle);
    return () => Taro.offAppShow(handle);
  };
};
