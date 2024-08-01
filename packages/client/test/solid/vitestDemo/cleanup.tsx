import '@testing-library/jest-dom/vitest';
import { onCleanup } from 'solid-js';
import { cleanup, render } from './index';

test('cleans up the document', () => {
  const spy = vi.fn();
  const divId = 'my-div';

  function Test() {
    onCleanup(() => {
      expect(document.getElementById(divId)).toBeInTheDocument();
      spy();
    });
    return <div id={divId} />;
  }

  render(() => <Test />);
  cleanup();
  expect(document.body.innerHTML).toBe('');
  expect(spy).toHaveBeenCalledTimes(1);
});
test('testEffect allows testing an effect asynchronously----onUnmounted', () => {
  // 定义 myOnMounted 函数，并明确返回类型为 void
  const myOnunmounted = (callback?: () => void): void => {
    onCleanup(callback || (() => {}));
  };

  const spy = vi.fn();
  const divId = 'my-div';

  function Test() {
    myOnunmounted(() => {
      expect(document.getElementById(divId)).toBeInTheDocument();
      spy();
    });
    return <div id={divId} />;
  }

  render(() => <Test />);
  cleanup();
  expect(document.body.innerHTML).toBe('');
  expect(spy).toHaveBeenCalledTimes(1);
});

test('cleanup does not error when an element is not a child', () => {
  render(() => <div />, { container: document.createElement('div') });
  cleanup();
});
