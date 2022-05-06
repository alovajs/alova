import myAssert from '../myAssert';
import { addStyleRow, TStyleBody } from './helper';

// keyframes动画样式模型映射类，可构建诸如 @keyframes [name] { ...样式内容 }格式的样式内容
export default class KeyframesModelMapper {
  private name: string;
  private rows: Record<string, TStyleBody> = {};
  constructor(name: string) {
    this.name = name;
  }

  // 添加keyframes的from部分
  public addFrom(key: string, val?: string|number, withPrefix = false, isImportant = false) {
    if (val === undefined || val == null) {
      return this;
    }
    let fromRows = this.rows.from;
    if (!fromRows) {
      fromRows = this.rows.from = {};
    }
    addStyleRow(fromRows, key, val, withPrefix, isImportant);
    return this;
  }
  // 添加keyframes的to部分
  public addTo(key: string, val?: string|number, withPrefix = false, isImportant = false) {
    if (val === undefined || val == null) {
      return this;
    }
    let toRows = this.rows.to;
    if (!toRows) {
      toRows = this.rows.to = {};
    }
    addStyleRow(toRows, key, val, withPrefix, isImportant);
    return this;
  }
  // 添加keyframes的百分比部分
  public addPercent(percent: number, key: string, val?: string|number, withPrefix = false, isImportant = false) {
    if (val === undefined || val == null) {
      return this;
    }
    const percentStr = percent + '%';
    const percentRows = this.rows[percentStr] = this.rows[percentStr] || {};
    addStyleRow(percentRows, key, val, withPrefix, isImportant);
    return this;
  }

  /**
   * 输出css字符串
   * @returns css字符串
   */
  public toString() {
    const rows = this.rows;
    const rowKeys = Object.keys(rows);
    myAssert(
      rowKeys.length > 0, 
      'must add from and to style rows, or add percent style rows'
    );
    const prefixs = ['', '-webkit-', '-moz-', '-o-'];
    const body = '{' + rowKeys.map(key => 
      `${key} {${Object.keys(rows[key])
          .map(innerKey => innerKey + ': ' + rows[key][innerKey] + ';')
          .join('')}}`
    ).join('') + '}';
    return prefixs.map(prefix => `@${prefix}keyframes ${this.name}` + body).join('\n');
  }

  /**
   * 构造动画style值
   * @param name 动画名称
   * @param duration 持续时间
   * @param timing 动画曲线
   * @returns 动画style值
   */
  static buildAnimationValue(name: string, duration: number, timing?: string, delay?: number) {
    timing = timing ? ` ${timing}` : '';
    const delayStr = delay && delay > 0 ? (` ${delay / 1000}s`) : '';
    return `${name} ${duration / 1000}s${timing}${delayStr}`;
  }
}