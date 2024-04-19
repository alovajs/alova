/**
 * 默认errorLogger函数
 */
export default (error: any) => {
  console.error(error.message || error);
};
