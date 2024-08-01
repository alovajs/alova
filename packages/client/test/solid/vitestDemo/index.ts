import { getQueriesForElement, prettyDOM } from '@testing-library/dom';
import {
  Accessor,
  createComponent,
  createRoot,
  createSignal,
  getOwner,
  lazy,
  onError,
  onMount,
  Owner,
  runWithOwner
} from 'solid-js';
import { hydrate as solidHydrate, render as solidRender } from 'solid-js/web';

import type {
  Options,
  Ref,
  RenderDirectiveOptions,
  RenderDirectiveResult,
  RenderHookOptions,
  RenderHookResult,
  Result,
  Ui
} from './types';

/* istanbul ignore next */
if (typeof process === 'undefined' || !process.env.STL_SKIP_AUTO_CLEANUP) {
  // @ts-ignore
  if (typeof afterEach === 'function') {
    afterEach(cleanup);
  }
}

const mountedContainers = new Set<Ref>();

/**
 * Renders a component to test it
 * @param ui {Ui} a function calling the component
 * @param options {Options} test options
 * @returns {Result} references and tools to test the component
 *
 * ```ts
 * const { getByText } = render(() => <App />, { wrapper: I18nProvider });
 * const button = getByText('Accept');
 * ```
 * ### Options
 * - `options.container` - the HTML element which the UI will be rendered into; otherwise a `<div>` will be created
 * - `options.baseElement` - the parent of the container, the default will be `<body>`
 * - `options.queries` - custom queries (see https://testing-library.com/docs/queries/about)
 * - `options.hydrate` - `true` if you want to test hydration
 * - `options.wrapper` - a component that applies a context provider and returns `props.children`
 * - `options.location` - wraps the component in a solid-router with memory integration pointing at the given path
 *
 * ### Result
 * - `result.asFragment()` - returns the HTML fragment as string
 * - `result.container` - the container in which the component is rendered
 * - `result.baseElement` - the parent of the component
 * - `result.debug()` - returns helpful debug output on the console
 * - `result.unmount()` - unmounts the component, usually automatically called in cleanup
 * - `result.`[queries] - testing library queries, see https://testing-library.com/docs/queries/about)
 */
function render(ui: Ui, options: Options = {}): Result {
  let { container, baseElement = container, queries, hydrate = false, wrapper, location } = options;

  if (!baseElement) {
    // Default to document.body instead of documentElement to avoid output of potentially-large
    // head elements (such as JSS style blocks) in debug output.
    baseElement = document.body;
  }

  if (!container) {
    container = baseElement.appendChild(document.createElement('div'));
  }

  const wrappedUi: Ui =
    typeof wrapper === 'function'
      ? () =>
          createComponent(wrapper!, {
            get children() {
              return createComponent(ui, {});
            }
          })
      : ui;

  const routedUi: Ui =
    typeof location === 'string'
      ? lazy(async () => {
          try {
            const { createMemoryHistory, MemoryRouter } = await import('@solidjs/router');
            const history = createMemoryHistory();
            location && history.set({ value: location, scroll: false, replace: true });
            return {
              default: () =>
                createComponent(MemoryRouter, {
                  history,
                  get children() {
                    return createComponent(wrappedUi, {});
                  }
                })
            };
          } catch (e: unknown) {
            console.error(
              `Error attempting to initialize @solidjs/router:\n"${
                (e instanceof Error && e.message) || e?.toString() || 'unknown error'
              }"`
            );
            return { default: () => createComponent(wrappedUi, {}) };
          }
        })
      : wrappedUi;

  const dispose = hydrate
    ? (solidHydrate(routedUi, container) as unknown as () => void)
    : solidRender(routedUi, container);

  // We'll add it to the mounted containers regardless of whether it's actually
  // added to document.body so the cleanup method works regardless of whether
  // they're passing us a custom container or not.
  mountedContainers.add({ container, dispose });

  const queryHelpers = getQueriesForElement(container, queries);

  return {
    asFragment: () => container?.innerHTML as string,
    container,
    baseElement,
    debug: (el = baseElement, maxLength, options) =>
      Array.isArray(el)
        ? el.forEach(e => console.log(prettyDOM(e, maxLength, options)))
        : console.log(prettyDOM(el, maxLength, options)),
    unmount: dispose,
    ...queryHelpers
  } as Result;
}

/**
 * "Renders" a hook to test it
 * @param hook {() => unknown)} a hook or primitive
 * @param options {RenderHookOptions} test options
 * @returns {RenderHookResult} references and tools to test the hook/primitive
 *
 * ```ts
 * const { result } = render(useI18n, { wrapper: I18nProvider });
 * expect(result.t('test')).toBe('works');
 * ```
 * ### Options
 * - `options.initialProps` - an array with the props that the hook will be provided with.
 * - `options.wrapper` - a component that applies a context provider and **always** returns `props.children`
 *
 * ### Result
 * - `result.result` - the return value of the hook/primitive
 * - `result.owner` - the reactive owner in which the hook is run (in order to run other reactive code in the same context with [`runWithOwner`](https://www.solidjs.com/docs/latest/api#runwithowner))
 * - `result.cleanup()` - calls the cleanup function of the hook/primitive
 */
export function renderHook<A extends any[], R>(
  hook: (...args: A) => R,
  options?: RenderHookOptions<A>
): RenderHookResult<R> {
  const initialProps: A | [] = Array.isArray(options) ? options : options?.initialProps || [];
  const [dispose, owner, result] = createRoot(dispose => {
    if (typeof options === 'object' && 'wrapper' in options && typeof options.wrapper === 'function') {
      let result: ReturnType<typeof hook>;
      options.wrapper({
        get children() {
          return createComponent(() => {
            result = hook(...(initialProps as A));
            return null;
          }, {});
        }
      });
      return [dispose, getOwner(), result!];
    }
    return [dispose, getOwner(), hook(...(initialProps as A))];
  });

  mountedContainers.add({ dispose });

  return { result, cleanup: dispose, owner };
}

/**
 * Applies a directive to a test container
 * @param directive {(ref, value: () => unknown)} a reusable custom directive
 * @param options {RenderDirectiveOptions} test options
 * @returns {RenderDirectiveResult} references and tools to test the directive
 *
 * ```ts
 * const called = vi.fn()
 * const { getByText, baseContainer } = render(onClickOutside, { initialValue: called });
 * expect(called).not.toBeCalled();
 * fireEvent.click(baseContainer);
 * expect(called).toBeCalled();
 * ```
 * ### Options
 * - `options.initialValue` - a value added to the directive
 * - `options.targetElement` - the name of a HTML element as a string or a HTMLElement or a function returning a HTMLElement
 * - `options.container` - the HTML element which the UI will be rendered into; otherwise a `<div>` will be created
 * - `options.baseElement` - the parent of the container, the default will be `<body>`
 * - `options.queries` - custom queries (see https://testing-library.com/docs/queries/about)
 * - `options.hydrate` - `true` if you want to test hydration
 * - `options.wrapper` - a component that applies a context provider and returns `props.children`
 *
 * ### Result
 * - `result.arg()` - the accessor for the value that the directive receives
 * - `result.setArg()` - the setter for the value that the directive receives
 * - `result.asFragment()` - returns the HTML fragment as string
 * - `result.container` - the container in which the component is rendered
 * - `result.baseElement` - the parent of the component
 * - `result.debug()` - returns helpful debug output on the console
 * - `result.unmount()` - unmounts the component, usually automatically called in cleanup
 * - `result.`[queries] - testing library queries, see https://testing-library.com/docs/queries/about)
 */
export function renderDirective<A extends any, U extends A, E extends HTMLElement>(
  directive: (ref: E, arg: Accessor<U>) => void,
  options?: RenderDirectiveOptions<U, E>
): RenderDirectiveResult<U> {
  const [arg, setArg] = createSignal(options?.initialValue as U);
  return Object.assign(
    render(() => {
      const targetElement =
        (options?.targetElement &&
          (options.targetElement instanceof HTMLElement
            ? options.targetElement
            : typeof options.targetElement === 'string'
              ? document.createElement(options.targetElement)
              : typeof options.targetElement === 'function'
                ? options.targetElement()
                : undefined)) ||
        document.createElement('div');
      onMount(() => directive(targetElement as E, arg as Accessor<U>));
      return targetElement;
    }, options),
    { arg, setArg }
  );
}

export function testEffect<T extends any = void>(fn: (done: (result: T) => void) => void, owner?: Owner): Promise<T> {
  const context: {
    promise?: Promise<T>;
    done?: (result: T) => void;
    fail?: (error: any) => void;
    dispose?: () => void;
  } = {};
  context.promise = new Promise<T>((resolve, reject) => {
    context.done = resolve;
    context.fail = reject;
  });
  context.dispose = createRoot(dispose => {
    onError(err => context.fail?.(err));
    (owner ? (done: (result: T) => void) => runWithOwner(owner, () => fn(done)) : fn)(result => {
      context.done?.(result);
      dispose();
    });
    return dispose;
  });
  return context.promise;
}

function cleanupAtContainer(ref: Ref) {
  const { container, dispose } = ref;
  if (typeof dispose === 'function') {
    dispose();
  } else {
    console.warn(
      'solid-testing-library: dispose is not a function - maybe your tests include multiple solid versions!'
    );
  }

  if (container?.parentNode === document.body) {
    document.body.removeChild(container);
  }

  mountedContainers.delete(ref);
}

function cleanup() {
  mountedContainers.forEach(cleanupAtContainer);
}

export * from '@testing-library/dom';
export { cleanup, render };
