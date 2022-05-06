/**
 * 空函数，做兼容处理
 */
export function noop() {}


/**
 * 解析样式值，如10px -> 10和px
 * @param styleVal 带单位的字符串
 * @returns 转换后的数值和单位
 */
export function parseStyleValue(styleVal: string) {
  const number = (styleVal.match(/^[0-9.]+/) || ['0'])[0];
  return {
    value: Number(number),
    unit: styleVal.replace(number, ''),
  };
}