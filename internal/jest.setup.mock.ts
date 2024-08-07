import { Blob, File } from 'node:buffer';
import { performance } from 'node:perf_hooks';
import { TextDecoder, TextEncoder } from 'node:util';
import { ReadableStream } from 'web-streams-polyfill';

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  ReadableStream: { value: ReadableStream },
  setImmediate: { value: setTimeout },
  clearImmediate: { value: clearTimeout },
  performance: {
    value: performance,
    writable: true
  }
});

// if the environment is jsdom, set process.cwd to undefined
if (typeof window !== 'undefined') {
  (process as any).cwd = undefined;
}

// undici must import after defining TextDecoder and TextEncoder, otherwise it will throw error
// eslint-disable-next-line
import { Headers, Request, Response, fetch } from 'undici';
Object.defineProperties(global, {
  fetch: { value: fetch, writable: true },
  Response: { value: Response },
  Request: { value: Request },
  Headers: { value: Headers },
  Blob: { value: Blob },
  File: { value: File },
  isSSR: { value: typeof window === 'undefined' }
});

/**
 * fix: fix: https://github.com/testing-library/svelte-testing-library/issues/222
 *
 * `onMount` will not be called on node environment.
 */
jest.mock('svelte', () => {
  const originalModule = jest.requireActual('svelte');
  const { onMount } = jest.requireActual('svelte/internal');

  return {
    __esModule: true,
    ...originalModule,
    onMount
  };
});
