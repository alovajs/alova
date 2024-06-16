import { createAssert } from '@alova/shared/assert';
import { instanceOf, isNumber, isString, statesHookHelper } from '@alova/shared/function';
import { falseValue, filterItem, forEach, objectKeys, pushItem, trueValue } from '@alova/shared/vars';
import { AlovaGenerics, promiseStatesHook } from 'alova';
import { AlovaFetcherMiddlewareContext, AlovaFrontMiddlewareContext, AlovaGuardNext } from '~/typings';
import { Actions } from '~/typings/general';

const actionsMap: Record<string | number | symbol, Actions[]> = {};
const isFrontMiddlewareContext = <AG extends AlovaGenerics = AlovaGenerics>(
  context: AlovaFrontMiddlewareContext<AG> | AlovaFetcherMiddlewareContext<AG>
): context is AlovaFrontMiddlewareContext<AG> => !!(context as AlovaFrontMiddlewareContext<AG>).send;

const assert = createAssert('subscriber');

/**
 * 操作函数委托中间件
 * 使用此中间件后可通过accessAction调用委托的函数
 * 可以委托多个相同id
 * 以此来消除组件的层级限制
 * @param id 委托者id
 * @returns alova中间件函数
 */
export const actionDelegationMiddleware = <AG extends AlovaGenerics = AlovaGenerics>(id: string | number | symbol) => {
  const { ref } = statesHookHelper(promiseStatesHook());

  const delegated = ref(falseValue);
  return (
    context: (AlovaFrontMiddlewareContext<AG> | AlovaFetcherMiddlewareContext<AG>) & { delegatingActions?: Actions },
    next: AlovaGuardNext<AG>
  ) => {
    // 中间件会重复调用，已经订阅过了就无需再订阅了
    if (!delegated.current) {
      const { abort, proxyStates, delegatingActions = {} } = context;
      const update = (newStates: Record<string, any>) => {
        type ProxyStateKeys = keyof typeof proxyStates;
        for (const key in newStates) {
          proxyStates[key as ProxyStateKeys] && (proxyStates[key as ProxyStateKeys].v = newStates[key]);
        }
      };
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
 * @param silent 默认为 false。如果为 true，不匹配时将不会报错
 */
export const accessAction = (
  id: string | number | symbol | RegExp,
  onMatch: (matchedSubscriber: Actions, index: number) => void,
  silent = false
) => {
  const matched = [] as Actions[];
  if (typeof id === 'symbol' || isString(id) || isNumber(id)) {
    actionsMap[id] && pushItem(matched, ...actionsMap[id]);
  } else if (instanceOf(id, RegExp)) {
    forEach(
      filterItem(objectKeys(actionsMap), idItem => id.test(idItem)),
      idItem => {
        pushItem(matched, ...actionsMap[idItem]);
      }
    );
  }

  // its opposite expression is too obscure
  if (matched.length === 0 && !silent) {
    assert(false, `no handler can be matched by using \`${id.toString()}\``);
  }

  forEach(matched, onMatch);
};
