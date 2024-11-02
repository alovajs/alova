import { AlovaGenerics, Method } from 'alova';
import { AlovaMethodHandler, ExportedState, UseHookExposure } from '../general';
import { RequestHookConfig } from './useRequest';

/**
 * useCaptcha configuration
 */
export type CaptchaHookConfig<AG extends AlovaGenerics, Args extends any[] = any[]> = {
  /**
   * Initial countdown, when the verification code is sent successfully, the countdown will start with this data
   * @default 60
   */
  initialCountdown?: number;
} & RequestHookConfig<AG, Args>;

/**
 * useCaptcha return value
 */
export interface CaptchaExposure<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends UseHookExposure<AG, Args, CaptchaExposure<AG, Args>> {
  /**
   * The current countdown is -1 every second. When the countdown reaches 0, the verification code can be sent again.
   */
  countdown: ExportedState<number, AG['StatesExport']>;
}

/**
 * Request hook for verification code sending scenario
 * @param handler method instance or get function
 * @param Configuration parameters
 * @return useCaptcha related data and operation functions
 */
export declare function useCaptcha<AG extends AlovaGenerics, Args extends any[] = any[]>(
  handler: Method<AG> | AlovaMethodHandler<AG, Args>,
  config?: CaptchaHookConfig<AG, Args>
): CaptchaExposure<AG, Args>;
