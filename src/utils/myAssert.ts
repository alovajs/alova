// 自定义断言函数，表达式为false时抛出错误
export default function(expression: boolean, msg: string) {
  if (!expression) {
    throw new Error(`[alova:error]${msg}`);
  }
}