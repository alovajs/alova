import { statesHookHelper } from '@/util/helper';
import {
  $self,
  createAssert,
  filterItem,
  forEach,
  instanceOf,
  isNumber,
  isString,
  objectKeys,
  objectValues,
  pushItem
} from '@alova/shared';
import { AlovaGenerics, promiseStatesHook } from 'alova';
import {
  Actions,
  AlovaFetcherMiddlewareContext,
  AlovaFrontMiddlewareContext,
  AlovaGuardNext
} from '~/typings/clienthook';

let currentHookIndex = 0;
// (id, (hookIndex, Actions))
const actionsMap: Record<string | number | symbol, Record<string | number, Actions>> = {};
const isFrontMiddlewareContext = <AG extends AlovaGenerics = AlovaGenerics, Args extends any[] = any[]>(
  context: AlovaFrontMiddlewareContext<AG, Args> | AlovaFetcherMiddlewareContext<AG, Args>
): context is AlovaFrontMiddlewareContext<AG, Args> => !!(context as AlovaFrontMiddlewareContext<AG, Args>).send;

const assert = createAssert('subscriber');

/**
 * Operation function delegation middleware
 * After using this middleware, you can call the delegated function through accessAction.
 * Can delegate multiple identical IDs
 * In order to eliminate the hierarchical restrictions of components
 * @param id Client ID
 * @returns alova middleware function
 */
export const actionDelegationMiddleware = <AG extends AlovaGenerics = AlovaGenerics, Args extends any[] = any[]>(
  id: string | number | symbol
) => {
  const { ref, onUnmounted } = statesHookHelper(promiseStatesHook());

  const hookIndex = ref(currentHookIndex + 1);

  if (hookIndex.current > currentHookIndex) {
    currentHookIndex += 1;
  }

  onUnmounted(() => {
    if (actionsMap[id]?.[hookIndex.current]) {
      // delete action on unmount
      delete actionsMap[id][hookIndex.current];
    }
  });

  return (
    context: (AlovaFrontMiddlewareContext<AG, Args> | AlovaFetcherMiddlewareContext<AG, Args>) & {
      delegatingActions?: Actions;
    },
    next: AlovaGuardNext<AG, Args>
  ) => {
    // The middleware will be called repeatedly. If you have already subscribed, you do not need to subscribe again.
    const { abort, proxyStates, delegatingActions = {} } = context;
    const update = (newStates: Record<string, any>) => {
      type ProxyStateKeys = keyof typeof proxyStates;
      for (const key in newStates) {
        proxyStates[key as ProxyStateKeys] && (proxyStates[key as ProxyStateKeys].v = newStates[key]);
      }
    };
    // Those with the same ID will be saved together in the form of an array
    const hooks = (actionsMap[id] = actionsMap[id] || []);
    const handler = isFrontMiddlewareContext(context)
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
        };

    hooks[hookIndex.current] = handler;

    return next();
  };
};

/**
 * Access the operation function, if there are multiple matches, onMatch will be called with this
 * @param id Delegator id, or regular expression
 * @param onMatch matching subscribers
 * @param silent Default is false. If true, no error will be reported if there is no match
 */
export const accessAction = (
  id: string | number | symbol | RegExp,
  onMatch: (matchedSubscriber: Actions, index: number) => void,
  silent = false
) => {
  const matched = [] as Actions[];
  if (typeof id === 'symbol' || isString(id) || isNumber(id)) {
    actionsMap[id] && pushItem(matched, ...objectValues(actionsMap[id]));
  } else if (instanceOf(id, RegExp)) {
    forEach(
      filterItem(objectKeys(actionsMap), idItem => id.test(idItem)),
      idItem => {
        pushItem(matched, ...objectValues(actionsMap[idItem]));
      }
    );
  }

  // its opposite expression is too obscure
  if (matched.length === 0 && !silent) {
    assert(false, `no handler can be matched by using \`${id.toString()}\``);
  }

  forEach(filterItem(matched, $self), onMatch);
};
