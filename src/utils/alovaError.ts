import { newInstance } from './helper';

/**
 * 构建错误信息
 * @param msg 错误信息
 * @returns 构建后的错误信息
 */
export const buildErrorMsg = (msg: string) => `[alova]${msg}`;
/**
 * 创建一个Alova错误对象
 * @param msg 错误消息
 * @returns 错误对象
 */
export default (msg: string, code?: any) => {
  const err = newInstance(Error, buildErrorMsg(msg));
  code && (err.name = code);
  return err;
};
