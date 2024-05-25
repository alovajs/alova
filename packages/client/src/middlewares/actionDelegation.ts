import { createAssert } from '@alova/shared/assert';
import { instanceOf, isNumber, isString, statesHookHelper } from '@alova/shared/function';
import { falseValue, filterItem, forEach, objectKeys, pushItem, trueValue } from '@alova/shared/vars';
import { AlovaGenerics, promiseStatesHook } from 'alova';
import { AlovaFetcherMiddlewareContext, AlovaFrontMiddlewareContext, AlovaGuardNext } from '~/typings';
import { Actions } from '~/typings/general';

type AnyAlovaFrontMiddlewareContext = AlovaFrontMiddlewareContext<AlovaGenerics>;
type AnyAlovaFetcherMiddlewareContext = AlovaFetcherMiddlewareContext<AlovaGenerics>;

const actionsMap: Record<string | number | symbol, Actions[]> = {};
const isFrontMiddlewareContext = (
  context: AnyAlovaFrontMiddlewareContext | AnyAlovaFetcherMiddlewareContext
): context is AnyAlovaFrontMiddlewareContext => !!(context as AnyAlovaFrontMiddlewareContext).send;

const assert = createAssert('subscriber');

/**
 * 操作函数委托中间件
 * 使用此中间件后可通过accessAction调用委托的函数
 * 可以委托多个相同id
 * 以此来消除组件的层级限制
 * @param id 委托者id
 * @returns alova中间件函数
 */
export const actionDelegationMiddleware = (id: string | number | symbol) => {
  const { ref } = statesHookHelper(promiseStatesHook());

  const delegated = ref(falseValue);
  return (
    context: (AnyAlovaFrontMiddlewareContext | AnyAlovaFetcherMiddlewareContext) & { delegatingActions?: Actions },
    next: AlovaGuardNext<AlovaGenerics>
  ) => {
    // 中间件会重复调用，已经订阅过了就无需再订阅了
    if (!delegated.current) {
      const { abort, update, delegatingActions = {} } = context;
      // 相同id的将以数组形式保存在一起
      const handlersItems = (actionsMap[id] = actionsMap[id] || []);
      handlersItems.push(
        isFrontMiddlewareContext(context)
          ? {
              ...delegatingActions,
              send: context.send,
              abort,
              update
            }
          : {
              ...delegatingActions,
              fetch: context.fetch,
              abort,
              update
            }
      );

      delegated.current = trueValue;
    }
    return next();
  };
};

/**
 * 访问操作函数，如果匹配多个则会以此调用onMatch
 * @param id 委托者id，或正则表达式
 * @param onMatch 匹配的订阅者
 */
export const accessAction = (
  id: string | number | symbol | RegExp,
  onMatch: (matchedSubscriber: Actions, index: number) => void
) => {
  const matched = [] as Actions[];
  if (typeof id === 'symbol' || isString(id) || isNumber(id)) {
    assert(!!actionsMap[id], `no handler which id is \`${id.toString()}\` is matched`);
    pushItem(matched, ...actionsMap[id]);
  } else if (instanceOf(id, RegExp)) {
    forEach(
      filterItem(objectKeys(actionsMap), idItem => id.test(idItem)),
      idItem => {
        pushItem(matched, ...actionsMap[idItem]);
      }
    );
  }
  forEach(matched, onMatch);
};
