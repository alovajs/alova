import { AlovaGenerics, Method } from 'alova';
import { AlovaMethodHandler, ExportedState, UseHookExposure } from '../general';
import { RequestHookConfig } from './useRequest';

/**
 * useCaptcha配置
 */
export type CaptchaHookConfig<AG extends AlovaGenerics> = {
  /**
   * 初始倒计时，当验证码发送成功时将会以此数据来开始倒计时
   * @default 60
   */
  initialCountdown?: number;
} & RequestHookConfig<AG>;

/**
 * useCaptcha返回值
 */
// @ts-ignore
export interface CaptchaExposure<AG extends AlovaGenerics> extends UseHookExposure<AG, CaptchaExposure<AG>> {
  /**
   * 当前倒计时，每秒-1，当倒计时到0时可再次发送验证码
   */
  countdown: ExportedState<number, AG['StatesExport']>;
}

/**
 * 验证码发送场景的请求hook
 * @param handler method实例或获取函数
 * @param 配置参数
 * @return useCaptcha相关数据和操作函数
 */
export declare function useCaptcha<AG extends AlovaGenerics>(
  handler: Method<AG> | AlovaMethodHandler<AG>,
  config?: CaptchaHookConfig<AG>
): CaptchaExposure<AG>;
