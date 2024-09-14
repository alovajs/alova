import { AlovaGenerics } from 'alova';
import { AlovaFetcherMiddlewareContext, AlovaFrontMiddlewareContext, AlovaGuardNext } from '../general';

export interface Actions {
  [x: string]: (...args: any[]) => any;
}

/**
 * 操作函数委托中间件
 * 使用此中间件后可通过accessAction调用委托的函数
 * 可以委托多个相同id
 * 以此来消除组件的层级限制
 * @param id 委托者id
 * @returns alova中间件函数
 */
export declare function actionDelegationMiddleware<
  AG extends AlovaGenerics = AlovaGenerics,
  Args extends any[] = any[]
>(
  id: string | number | symbol
): (
  context: (AlovaFrontMiddlewareContext<AG, Args> | AlovaFetcherMiddlewareContext<AG>) & {
    delegatingActions?: Actions;
  },
  next: AlovaGuardNext<AG>
) => Promise<any>;

/**
 * 访问操作函数，如果匹配多个则会以此调用onMatch
 * @param id 委托者id，或正则表达式
 * @param onMatch 匹配的订阅者
 */
export declare function accessAction(
  id: string | number | symbol | RegExp,
  onMatch: (matchedSubscriber: Record<string, any>, index: number) => void
): void;
