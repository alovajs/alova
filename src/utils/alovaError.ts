/**
 * 创建一个Alova错误对象
 * @param msg 错误消息
 * @returns 错误对象
 */
export default (msg: string, code?: any) => {
  const err = new Error(`[alova:Error]${msg}`);
  code && (err.name = code);
  return err;
};
