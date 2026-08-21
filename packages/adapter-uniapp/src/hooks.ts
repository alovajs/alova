import { useAutoRequest, useSSE, useUploader } from 'alova/client';
import UniappEventSource from './UniappEventSource';

type SelectFileOptions = Parameters<typeof useUploader.selectFile>[0];

/**
 * uniapp 平台的文件选择器，基于 `uni.chooseFile`
 */
const uniappSelectFile = ({ multiple, accept }: SelectFileOptions = {}) =>
  new Promise(resolve => {
    uni.chooseFile({
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
 * 识别 uniapp 选择的临时文件对象（含 `path` 字段），直接作为上传文件使用
 */
const uniappFileConverter = {
  name: 'uniapp-file',
  is: (rawFile: any) => !!rawFile?.file && typeof rawFile.file === 'object' && typeof rawFile.file.path === 'string',
  convert: (rawFile: any) => rawFile.file
};

/**
 * 在 `AdapterUniapp` 中自动注入平台相关的 hook 配置：
 * - `useSSE.EventSource`：使用 uniapp 的 EventSource 实现
 * - `useUploader.selectFile` / `useUploader.converters`：使用 uniapp 的文件选择与类型转换
 * - `useAutoRequest.onNetwork` / `onFocus` / `onVisibility`：使用 uniapp 的网络/前台监听
 */
export const setupHooks = () => {
  useSSE.EventSource = UniappEventSource;

  useUploader.selectFile = uniappSelectFile as typeof useUploader.selectFile;
  if (!useUploader.converters.some(({ name }) => name === uniappFileConverter.name)) {
    useUploader.converters.push(uniappFileConverter as any);
  }

  useAutoRequest.onNetwork = notify => {
    const handle = (res: any) => {
      res.isConnected && notify();
    };
    uni.onNetworkStatusChange(handle);
    return () => uni.offNetworkStatusChange(handle);
  };
  useAutoRequest.onFocus = notify => {
    const handle = () => notify();
    uni.onAppShow(handle);
    return () => uni.offAppShow(handle);
  };
  useAutoRequest.onVisibility = notify => {
    const handle = () => notify();
    uni.onAppShow(handle);
    return () => uni.offAppShow(handle);
  };
};
